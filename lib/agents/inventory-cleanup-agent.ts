/**
 * Inventory Cleanup Agent — Futura OS
 * Audits catalog completeness, cleans up stale/sold properties,
 * and centralizes photos/videos into Cloudinary & Airtable.
 */

import { BaseAgent, type AgentResponse } from "./base-agent";
import { TABLES, FIELD, listAll, updateRecord, text, num, select, photos, missingItems } from "../airtable-client";
import { uploadFromUrl, FOLDERS } from "../cloudinary";

export type InventoryItemHealth = {
  id: string;
  code: string;
  title: string;
  commercialStatus: string;
  price?: number;
  location?: string;
  propertyType?: string;
  photosCount: number;
  completionScore: number;
  missingFields: string[];
  isReady: boolean;
  isStale: boolean;
  recommendation: "confirm_active" | "archive_sold" | "add_photos" | "fill_price";
};

export type InventoryHealthReport = {
  totalActive: number;
  readyCount: number;
  incompleteCount: number;
  staleCount: number;
  missingPhotosCount: number;
  items: InventoryItemHealth[];
};

const INVENTORY_CLEANUP_PROMPT = `Eres el Agente de Depuración y Orden de Inventario Inmobiliario de Futura Bienes Raíces.
Tu función es auditar la base de datos de propiedades, identificar registros obsoletos, fichas incompletas o sin fotos, y guiar al usuario para centralizar todo su inventario en Cloudinary y Airtable.

REGLAS:
1. Prioriza la claridad: Separa las propiedades listas para venta de aquellas que deben archivarse (vendidas/alquiladas/obsoletas) o completarse.
2. Identifica qué datos clave faltan (Fotos, Precio, Zona, Descripción, Video).
3. Recomienda la acción inmediata concreta para cada registro.

Devuelve SIEMPRE JSON estructurado.`;

const inventoryCleanupAgent = new BaseAgent({
  name: "Depurador de Inventario AI",
  role: "Auditor y organizador de catálogo inmobiliario",
  systemPrompt: INVENTORY_CLEANUP_PROMPT,
  maxTokens: 1200,
  temperature: 0.1,
  actionLevel: "assisted",
});

// ─── 1. Audit Full Inventory Health ─────────────────────────────────

export async function auditInventoryHealth(): Promise<InventoryHealthReport> {
  const records = await listAll(TABLES.properties);

  let readyCount = 0;
  let incompleteCount = 0;
  let staleCount = 0;
  let missingPhotosCount = 0;

  const items: InventoryItemHealth[] = records.map((r) => {
    const f = r.fields;
    const commercialStatus = select(f, FIELD.properties.commercialStatus) || "Disponible";
    const propertyPhotos = photos(f, FIELD.properties.photos);
    const photosCount = propertyPhotos.length;
    const price = num(f, FIELD.properties.price);
    const title = text(f, FIELD.properties.title) || text(f, FIELD.properties.code) || "Propiedad sin nombre";
    const code = text(f, FIELD.properties.code) || r.id;
    const zone = text(f, FIELD.properties.zone) || text(f, FIELD.properties.municipality) || "";
    const propertyType = select(f, FIELD.properties.type) || "Casa";
    const rawMissing = text(f, FIELD.properties.missing);
    const missingFields = missingItems(rawMissing);

    if (photosCount === 0) missingFields.push("fotos principales");
    if (!price) missingFields.push("precio");
    if (!zone) missingFields.push("ubicación/zona");

    const uniqueMissing = Array.from(new Set(missingFields));
    const isReady = photosCount >= 3 && Boolean(price) && Boolean(zone) && uniqueMissing.length === 0;

    let recommendation: InventoryItemHealth["recommendation"] = "confirm_active";
    if (!price) {
      recommendation = "fill_price";
    } else if (photosCount === 0) {
      recommendation = "add_photos";
    } else if (["Vendida", "Alquilada", "Archivada"].includes(commercialStatus)) {
      recommendation = "archive_sold";
    }

    const isInactive = ["Vendida", "Alquilada", "Archivada"].includes(commercialStatus);
    const isStale = !isInactive && photosCount === 0 && !price;

    if (!isInactive) {
      if (isReady) readyCount++;
      else incompleteCount++;
      if (photosCount === 0) missingPhotosCount++;
      if (isStale) staleCount++;
    }

    const completionScore = Math.max(
      10,
      100 - uniqueMissing.length * 20 + (photosCount > 0 ? 20 : 0)
    );

    return {
      id: r.id,
      code,
      title,
      commercialStatus,
      price: price || undefined,
      location: zone || undefined,
      propertyType,
      photosCount,
      completionScore,
      missingFields: uniqueMissing,
      isReady,
      isStale,
      recommendation,
    };
  });

  const activeItems = items.filter(
    (i) => !["Vendida", "Alquilada", "Archivada"].includes(i.commercialStatus)
  );

  return {
    totalActive: activeItems.length,
    readyCount,
    incompleteCount,
    staleCount,
    missingPhotosCount,
    items,
  };
}

// ─── 2. Batch Update Status (Mark Sold, Archive, Active) ─────────────

export async function batchUpdateStatus(
  propertyIds: string[],
  newStatus: "Disponible" | "Vendida" | "Alquilada" | "Archivada"
): Promise<{ updatedCount: number }> {
  let count = 0;
  for (const id of propertyIds) {
    try {
      await updateRecord(TABLES.properties, id, {
        [FIELD.properties.commercialStatus]: newStatus,
      });
      count++;
    } catch (err) {
      console.warn(`No se pudo actualizar la propiedad ${id}:`, err);
    }
  }
  return { updatedCount: count };
}

// ─── 3. Upload & Attach Photos/Media to Cloudinary & Airtable ─────────

export async function attachMediaToProperty(
  propertyId: string,
  mediaUrls: string[],
  driveUrl?: string
): Promise<{ uploadedAssets: string[]; updated: boolean }> {
  const records = await listAll(TABLES.properties);
  const target = records.find((r) => r.id === propertyId);
  if (!target) throw new Error("Propiedad no encontrada en Airtable.");

  const code = text(target.fields, FIELD.properties.code) || propertyId;
  const folderPath = `${FOLDERS.properties}/${code}`;

  const uploadedUrls: string[] = [];

  for (const url of mediaUrls) {
    if (!url.trim()) continue;
    try {
      const asset = await uploadFromUrl(url.trim(), folderPath, [code, "propiedad"]);
      if (asset?.secure_url) {
        uploadedUrls.push(asset.secure_url);
      }
    } catch (err) {
      console.warn(`Error al subir imagen URL ${url} a Cloudinary:`, err);
      // Si la URL es directa, conservarla
      if (url.startsWith("http")) uploadedUrls.push(url);
    }
  }

  const existingPhotos = photos(target.fields, FIELD.properties.photos);
  const combinedPhotos = Array.from(new Set([...existingPhotos, ...uploadedUrls])).map((u) => ({ url: u }));

  const updateFields: Record<string, unknown> = {};

  if (combinedPhotos.length > 0) {
    updateFields[FIELD.properties.photos] = combinedPhotos;
  }

  if (driveUrl?.trim()) {
    updateFields[FIELD.properties.drive] = driveUrl.trim();
  }

  if (Object.keys(updateFields).length > 0) {
    await updateRecord(TABLES.properties, propertyId, updateFields);
  }

  return {
    uploadedAssets: uploadedUrls,
    updated: true,
  };
}

export { inventoryCleanupAgent };
