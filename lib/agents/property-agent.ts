/**
 * Property Agent — Futura OS
 * Analyzes properties, detects missing data, and suggests improvements.
 */

import { BaseAgent, type AgentResponse } from "./base-agent";
import { TABLES, FIELD, listAll, text, num, select, photos, missingItems } from "../airtable-client";

export type PropertyAnalysis = {
  completeness: number;
  missingFields: string[];
  suggestions: string[];
  marketReady: boolean;
  estimatedTimeToReady: string;
};

const PROPERTY_PROMPT = `Eres el Agente de Propiedades de Futura Bienes Raíces. Analizas fichas inmobiliarias y detectas qué falta.

REGLAS:
1. Revisa que tenga: título, código, tipo, operación, precio, ubicación, fotos (mínimo 5), descripción, amenidades, video.
2. Calcula un porcentaje de completitud real.
3. Prioriza lo que más impacta en la venta: fotos > precio > descripción > video.
4. No inventes datos faltantes, solo señala qué hace falta y por qué importa.
5. Sugiere acciones concretas para completar la ficha.

Devuelve JSON:
{
  "answer": "Resumen de 1-2 líneas",
  "analysis": {
    "completeness": 75,
    "missingFields": ["fotos profesionales", "video recorrido"],
    "suggestions": ["Agendar sesión fotográfica", "Confirmar precio con propietario"],
    "marketReady": false,
    "estimatedTimeToReady": "2-3 días con acceso al inmueble"
  }
}`;

const propertyAgent = new BaseAgent({
  name: "Propiedad AI",
  role: "Analista de fichas y preparación de propiedades",
  systemPrompt: PROPERTY_PROMPT,
  maxTokens: 1000,
  temperature: 0.1,
  actionLevel: "assisted",
});

// ─── Analyze a single property ──────────────────────────────────────

export async function analyzeProperty(propertyId: string): Promise<AgentResponse<{ analysis: PropertyAnalysis }>> {
  const records = await listAll(TABLES.properties);
  const record = records.find((r) => r.id === propertyId);
  if (!record) throw new Error("Propiedad no encontrada.");

  const f = record.fields;
  const propertyData = {
    id: record.id,
    code: text(f, FIELD.properties.code),
    title: text(f, FIELD.properties.title),
    type: select(f, FIELD.properties.type),
    operation: select(f, FIELD.properties.operation),
    price: num(f, FIELD.properties.price),
    area: num(f, FIELD.properties.area),
    bedrooms: num(f, FIELD.properties.bedrooms),
    bathrooms: num(f, FIELD.properties.bathrooms),
    parking: num(f, FIELD.properties.parking),
    zone: text(f, FIELD.properties.zone),
    municipality: text(f, FIELD.properties.municipality),
    amenities: text(f, FIELD.properties.amenities),
    summary: text(f, FIELD.properties.summary),
    video: text(f, FIELD.properties.video),
    drive: text(f, FIELD.properties.drive),
    photosCount: photos(f, FIELD.properties.photos).length,
    missing: text(f, FIELD.properties.missing),
    preparation: text(f, FIELD.properties.preparation),
    completion: num(f, FIELD.properties.completion),
    status: select(f, FIELD.properties.commercialStatus),
  };

  return propertyAgent.execute(
    `Analiza esta propiedad y dime qué le falta para estar lista:\n${JSON.stringify(propertyData)}`,
  ) as Promise<AgentResponse<{ analysis: PropertyAnalysis }>>;
}

// ─── Quick audit of all properties ──────────────────────────────────

export async function auditAllProperties(): Promise<{
  total: number;
  ready: number;
  needsWork: number;
  critical: Array<{ id: string; code: string; title: string; missing: string[]; completion: number }>;
}> {
  const records = await listAll(TABLES.properties);

  const results = records.map((r) => {
    const f = r.fields;
    const status = select(f, FIELD.properties.commercialStatus);
    const missing = missingItems(text(f, FIELD.properties.missing));
    const hasPhotos = photos(f, FIELD.properties.photos).length >= 3;
    const hasPrice = num(f, FIELD.properties.price) > 0;
    const hasSummary = text(f, FIELD.properties.summary).length > 20;
    const completion = num(f, FIELD.properties.completion);

    const isReady = hasPhotos && hasPrice && hasSummary && missing.length === 0;

    return {
      id: r.id,
      code: text(f, FIELD.properties.code),
      title: text(f, FIELD.properties.title) || "Sin título",
      status,
      missing,
      completion,
      isReady,
      isActive: !["Vendida", "Alquilada", "Archivada"].includes(status),
    };
  });

  const active = results.filter((r) => r.isActive);

  return {
    total: active.length,
    ready: active.filter((r) => r.isReady).length,
    needsWork: active.filter((r) => !r.isReady).length,
    critical: active
      .filter((r) => !r.isReady)
      .sort((a, b) => a.completion - b.completion)
      .slice(0, 10)
      .map(({ id, code, title, missing, completion }) => ({ id, code, title, missing, completion })),
  };
}

export { propertyAgent };
