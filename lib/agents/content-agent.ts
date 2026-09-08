/**
 * Content Agent — Futura OS
 * Generates marketing content, images, and video configs for properties.
 */

import { BaseAgent, type AgentResponse } from "./base-agent";
import { generateImage, generatePropertyFlyer, generatePropertySocialPost, type ImageResult } from "../media/image-generator";
import { generateVideo, buildVideoConfig, type VideoRequest, type VideoResult } from "../media/video-generator";
import { TABLES, FIELD, listAll, text, num, photos, select } from "../airtable-client";
import type { CatalogProperty } from "../dashboard";

export type ContentPlan = {
  socialPost: string;
  story: string;
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
  videoScript: string;
  callToAction: string;
  hashtags: string[];
};

export type ContentBundle = {
  plan: ContentPlan;
  images: ImageResult[];
  video: VideoResult | null;
  property: {
    title: string;
    price: string;
    location: string;
    type: string;
  };
};

const CONTENT_PROMPT = `Eres Camila, la Directora de Contenido de Futura Bienes Raíces. Cuando te pidan contenido, ENTRÉGALO de inmediato — no expliques lo que harás, hazlo.

REGLAS:
1. Si te piden un post de Instagram, escribe el post completo listo para publicar.
2. No inventes datos, precios ni características que no se te hayan dado.
3. Los textos deben ser directos, emotivos pero honestos, con llamado a la acción claro.
4. Incluye hashtags relevantes para El Salvador/inmobiliaria.
5. Usa emojis para hacer el contenido más atractivo.
6. Máximo 300 caracteres para Instagram, más conciso para WhatsApp.

Devuelve JSON con esta estructura EXACTA:
{
  "answer": "El contenido completo listo para usar (post, copy, etc.) con emojis y hashtags incluidos"
}`;

const contentAgent = new BaseAgent({
  name: "Contenido AI",
  role: "Director de contenido y marketing digital",
  systemPrompt: CONTENT_PROMPT,
  maxTokens: 1500,
  temperature: 0.4,
  actionLevel: "assisted",
});

// ─── Generate full content bundle for a property ────────────────────

export async function generatePropertyContent(property: {
  title: string;
  price?: string;
  location?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: string;
  photos?: string[];
}): Promise<ContentBundle> {
  const propertyInfo = {
    title: property.title,
    price: property.price || "Consultar",
    location: property.location || "El Salvador",
    type: property.type || "Propiedad",
  };

  // 1. Generate content plan via AI
  const prompt = `Genera contenido de marketing para esta propiedad:
Nombre: ${property.title}
Tipo: ${property.type || "No especificado"}
Precio: ${property.price || "Por consultar"}
Ubicación: ${property.location || "No especificada"}
Habitaciones: ${property.bedrooms || "N/A"}
Baños: ${property.bathrooms || "N/A"}
Área: ${property.area ? property.area + "m²" : "N/A"}
Amenidades: ${property.amenities || "No registradas"}`;

  const response = await contentAgent.execute(prompt);
  const plan = (response.data as { plan?: ContentPlan })?.plan || {
    socialPost: `🏠 ${property.title} en ${property.location || "ubicación privilegiada"}. ¡Contáctanos!`,
    story: `✨ Nueva propiedad: ${property.title}`,
    whatsapp: `Hola, te comparto esta propiedad: ${property.title}. ¿Te interesa?`,
    emailSubject: `Propiedad destacada: ${property.title}`,
    emailBody: `Conoce ${property.title}, una propiedad que podría interesarte.`,
    videoScript: `[ESCENA 1] Exterior de la propiedad\n[ESCENA 2] Interior principal\n[ESCENA 3] Detalles y amenidades\n[ESCENA 4] Contacto`,
    callToAction: "¡Agenda tu visita hoy!",
    hashtags: ["BienesRaíces", "ElSalvador", "PropiedadesEnVenta"],
  };

  // 2. Generate images
  const images: ImageResult[] = [
    generatePropertySocialPost(propertyInfo),
    generatePropertyFlyer(propertyInfo),
  ];

  // 3. Generate video config
  let video: VideoResult | null = null;
  if (property.photos?.length) {
    try {
      const videoRequest: VideoRequest = {
        slides: property.photos.slice(0, 6).map((url, i) => ({
          imageUrl: url,
          title: i === 0 ? property.title : undefined,
          subtitle: i === 0 ? property.price : undefined,
        })),
        property: {
          title: property.title,
          price: property.price,
          location: property.location,
          type: property.type,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
        },
        format: "reel",
        branding: { name: "Futura Bienes Raíces" },
      };
      video = await generateVideo(videoRequest);
    } catch (error) {
      console.warn("No se pudo generar video:", error);
    }
  }

  return { plan, images, video, property: propertyInfo };
}

// ─── Generate content for a property by Airtable ID ─────────────────

export async function generateContentForPropertyId(propertyId: string): Promise<ContentBundle> {
  const records = await listAll(TABLES.properties);
  const record = records.find((r) => r.id === propertyId);
  if (!record) throw new Error("Propiedad no encontrada.");

  const f = record.fields;
  const price = num(f, FIELD.properties.price);

  return generatePropertyContent({
    title: text(f, FIELD.properties.title) || text(f, FIELD.properties.code) || "Propiedad",
    price: price ? new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price) : undefined,
    location: [text(f, FIELD.properties.zone), text(f, FIELD.properties.municipality)].filter(Boolean).join(", "),
    type: select(f, FIELD.properties.type),
    bedrooms: num(f, FIELD.properties.bedrooms),
    bathrooms: num(f, FIELD.properties.bathrooms),
    area: num(f, FIELD.properties.area),
    amenities: text(f, FIELD.properties.amenities),
    photos: photos(f, FIELD.properties.photos),
  });
}

// ─── Quick social post ──────────────────────────────────────────────

export async function generateQuickPost(propertyTitle: string, context?: string): Promise<AgentResponse> {
  return contentAgent.execute(
    `Genera un post rápido para Instagram sobre: ${propertyTitle}. ${context || ""}`
  );
}

// ─── Ask Camila with real Airtable property context ─────────────────

export async function askContentAgent(userRequest: string): Promise<AgentResponse> {
  // Cargar propiedades publicadas o listas de Airtable
  let propertyContext = "";
  try {
    const properties = await listAll(TABLES.properties);
    const activeProps = properties
      .filter((r) => {
        const status = select(r.fields, FIELD.properties.commercialStatus);
        return ["Lista para publicar", "Publicada", "Con interesados", "Disponible"].includes(status);
      })
      .slice(0, 8)
      .map((r) => {
        const price = num(r.fields, FIELD.properties.price);
        return {
          titulo: text(r.fields, FIELD.properties.title) || text(r.fields, FIELD.properties.code) || "Sin nombre",
          tipo: select(r.fields, FIELD.properties.type),
          precio: price ? `$${price.toLocaleString("es-US")}` : "Consultar",
          zona: text(r.fields, FIELD.properties.zone),
          municipio: text(r.fields, FIELD.properties.municipality),
          habitaciones: num(r.fields, FIELD.properties.bedrooms),
          banos: num(r.fields, FIELD.properties.bathrooms),
          area: num(r.fields, FIELD.properties.area),
          estado: select(r.fields, FIELD.properties.commercialStatus),
        };
      });

    if (activeProps.length > 0) {
      propertyContext = `\n\nPROPIEDADES REALES DISPONIBLES EN AIRTABLE:\n${JSON.stringify(activeProps, null, 2)}`;
    }
  } catch (err) {
    console.warn("No se pudo cargar propiedades para Camila:", err);
  }

  return contentAgent.execute(
    `${userRequest}${propertyContext}\n\nInstrucción: Si el usuario menciona una propiedad específica, usa sus datos reales de la lista de arriba. Si no menciona propiedad, elige la más relevante o interesante de las disponibles para crear el contenido.`
  );
}

export { contentAgent };
