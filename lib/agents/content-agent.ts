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

const CONTENT_PROMPT = `Eres el Director de Contenido de Futura Bienes Raíces. Creas contenido inmobiliario profesional, honesto y efectivo.

REGLAS:
1. No inventes datos, precios, descuentos ni características que no estén en la información proporcionada.
2. Los textos deben ser directos, emotivos pero honestos, y con un llamado a la acción claro.
3. Adapta el tono al canal: Instagram es visual/corto, WhatsApp es personal/directo, Email es profesional.
4. Incluye hashtags relevantes para El Salvador/inmobiliaria.
5. El guion de video debe ser para un reel de 30-45 segundos con narración y texto en pantalla.

Devuelve SOLO JSON con esta estructura:
{
  "answer": "Resumen de lo generado",
  "plan": {
    "socialPost": "Texto para Instagram/Facebook (máx 300 caracteres)",
    "story": "Texto para historia de Instagram (máx 150 caracteres)",
    "whatsapp": "Mensaje para WhatsApp (personal, directo)",
    "emailSubject": "Asunto del correo",
    "emailBody": "Cuerpo del correo",
    "videoScript": "Guion del reel con indicaciones [ESCENA 1]...",
    "callToAction": "CTA principal",
    "hashtags": ["hashtag1", "hashtag2"]
  }
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

export { contentAgent };
