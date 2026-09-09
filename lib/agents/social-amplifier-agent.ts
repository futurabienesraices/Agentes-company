/**
 * Social Amplifier Agent — Futura OS
 * Ingests raw social posts (Instagram, Facebook, TikTok), extracts property data,
 * audits post conversion bottlenecks, matches with CRM buyers, and generates multi-channel amplification assets.
 */

import { BaseAgent, type AgentResponse } from "./base-agent";
import { type Demand, type Property, scoreMatch, calculateMatches } from "../matching";
import { TABLES, FIELD, listAll, text, num, select } from "../airtable-client";

export type IngestedPropertyData = {
  title: string;
  price?: number;
  location?: string;
  propertyType?: string;
  operation?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: string[];
  rawSummary?: string;
  missingFields: string[];
  completenessScore: number;
};

export type PostAuditDiagnosis = {
  overallScore: number; // 0 - 100
  copyRating: "Excelente" | "Aceptable" | "Deficiente";
  ctaRating: "Fuerte" | "Débil" | "Ausente";
  leadMagnetPresent: boolean;
  bottlenecks: string[];
  recommendedFixes: string[];
  conversionStrategy: string;
};

export type AmplificationPackage = {
  reelScript: {
    hook: string;
    body: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  whatsAppBroadcast: string;
  facebookMarketplaceCopy: string;
  leadMagnetKeyword: string;
  directOutreachTemplates: Array<{
    buyerName: string;
    buyerDemandId: string;
    matchScore: number;
    personalizedMessage: string;
  }>;
};

const SOCIAL_AMPLIFIER_PROMPT = `Eres el Agente de Exponenciación y Redes Inmobiliarias de Futura Bienes Raíces.
Tu trabajo es analizar publicaciones existentes de redes sociales (Instagram, Facebook, TikTok), extraer los datos clave de las propiedades, diagnosticar por qué NO están convirtiendo en ventas y generar un plan de amplificación masiva de alto impacto.

Reglas:
1. Extrae con precisión: Título/Nombre, Precio en USD, Ubicación/Zona, Tipo de Inmueble (Casa, Apartamento, Terreno, Local), Operación (Venta/Alquiler), Habitaciones, Baños, Área m², Amenidades.
2. Evalúa objetivamente el copy y la estructura actual. Identifica qué falta para cerrar ventas (falta de precio, sin llamado a la acción claro, falta de gancho en los primeros 3 segundos, sin embudo directo a WhatsApp).
3. Diseña un plan de exponenciación multi-canal:
   - Guion de Reel/TikTok de 15 segundos con gancho de alta retención ("Hook").
   - Formato estructurado para listas de difusión de WhatsApp con emojis y viñetas claras.
   - Copy optimizado para Facebook Marketplace con palabras clave de búsqueda SEO.
   - Palabra clave para disparador de embudo (ej: "Escribe CASA para ficha técnica").
4. Genera mensajes personalizados para prospectos interesados basados en sus preferencias.

Devuelve SIEMPRE JSON estructurado con la respuesta deseada.`;

const socialAmplifierAgent = new BaseAgent({
  name: "Exponenciador Redes AI",
  role: "Especialista en extracción, diagnóstico y amplificación inmobiliaria multi-canal",
  systemPrompt: SOCIAL_AMPLIFIER_PROMPT,
  maxTokens: 1800,
  temperature: 0.3,
  actionLevel: "assisted",
});

// ─── 1. Ingest & Extract Property from Social Text ───────────────────

export async function ingestSocialPost(
  rawPostText: string,
  mediaUrls?: string[]
): Promise<IngestedPropertyData> {
  const prompt = `Analiza el siguiente texto de una publicación de redes sociales y extrae los datos de la propiedad:

TEXTO DE LA PUBLICACIÓN:
"""
${rawPostText}
"""

${mediaUrls?.length ? `URLs de imágenes adjuntas: ${mediaUrls.join(", ")}` : ""}

Responde en JSON con este formato:
{
  "answer": "Resumen breve de lo extraído",
  "property": {
    "title": "Nombre atractivo de la propiedad",
    "price": 120000,
    "location": "Zona / Municipio / Ciudad",
    "propertyType": "Casa | Apartamento | Terreno | Local",
    "operation": "Venta | Alquiler",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 150,
    "amenities": ["Piscina", "Cochera", "Seguridad 24/7"],
    "rawSummary": "Descripción sintetizada",
    "missingFields": ["precio explícito", "área en m2"],
    "completenessScore": 75
  }
}`;

  const res = await socialAmplifierAgent.execute(prompt);
  const data = (res.data as { property?: IngestedPropertyData })?.property;

  if (data) {
    return {
      title: data.title || "Propiedad sin título",
      price: data.price ? Number(data.price) : undefined,
      location: data.location || "Ubicación por confirmar",
      propertyType: data.propertyType || "Casa",
      operation: data.operation || "Venta",
      bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
      area: data.area ? Number(data.area) : undefined,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      rawSummary: data.rawSummary || rawPostText.slice(0, 200),
      missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
      completenessScore: typeof data.completenessScore === "number" ? data.completenessScore : 60,
    };
  }

  return {
    title: "Propiedad extraída de redes",
    rawSummary: rawPostText.slice(0, 200),
    missingFields: ["precio", "ubicación exacta"],
    completenessScore: 50,
  };
}

// ─── 2. Audit Post Performance Bottlenecks ───────────────────────────

export async function auditSocialPost(
  propertyData: IngestedPropertyData,
  rawPostText: string
): Promise<PostAuditDiagnosis> {
  const prompt = `Realiza un diagnóstico de conversión para esta publicación de redes sociales inmobiliaria:

PROPIEDAD:
${JSON.stringify(propertyData, null, 2)}

COPY ORIGINAL UTILIZADO:
"""
${rawPostText}
"""

Evalúa por qué esta publicación no está generando prospectos ni llamadas. Analiza la falta de embudo, claridad de precio, llamado a la acción y gancho inicial.

Responde en JSON con esta estructura exacta:
{
  "answer": "Resumen ejecutivo del diagnóstico",
  "audit": {
    "overallScore": 45,
    "copyRating": "Deficiente",
    "ctaRating": "Ausente",
    "leadMagnetPresent": false,
    "bottlenecks": [
      "No se menciona el precio explícito, lo que genera desconfianza y baja interacción",
      "No hay enlace directo a WhatsApp ni palabra clave de respuesta automática",
      "El texto es un bloque plano sin viñetas ni estructura visual"
    ],
    "recommendedFixes": [
      "Publicar el precio o rango de inversión claramente",
      "Agregar un disparador directo: 'Comenta CASA para enviarte el video tour en WhatsApp'",
      "Formatear el texto con emojis y viñetas de lectura rápida"
    ],
    "conversionStrategy": "Transformar la publicación estática en un embudo interactivo mediante gancho en video y captura automática por palabras clave."
  }
}`;

  const res = await socialAmplifierAgent.execute(prompt);
  const audit = (res.data as { audit?: PostAuditDiagnosis })?.audit;

  if (audit) return audit;

  return {
    overallScore: 50,
    copyRating: "Aceptable",
    ctaRating: "Débil",
    leadMagnetPresent: false,
    bottlenecks: ["Falta de llamado a la acción directo", "Sin disparador interactivo"],
    recommendedFixes: ["Añadir enlace a WhatsApp", "Formatear texto con viñetas"],
    conversionStrategy: "Conectar la publicación con respuesta automática en WhatsApp.",
  };
}

// ─── 3. Generate Amplification Package ───────────────────────────────

export async function generateAmplificationAssets(
  propertyData: IngestedPropertyData,
  matchedDemands: Array<{ id: string; name: string; score: number }>
): Promise<AmplificationPackage> {
  const prompt = `Crea un paquete completo de exponenciación y ventas para esta propiedad inmobiliaria:

PROPIEDAD:
${JSON.stringify(propertyData, null, 2)}

COMPRADORES POTENCIALES EN CRM (MATCHES):
${JSON.stringify(matchedDemands, null, 2)}

Genera:
1. Guion de Reel / TikTok de 15s con Gancho ("Hook") de alta retención, desarrollo y CTA.
2. Mensaje formateado para difusión de WhatsApp.
3. Copy optimizado para Facebook Marketplace con palabras clave SEO.
4. Palabra clave ideal para disparador automático ("Lead Magnet Keyword").
5. Plantillas de mensaje personalizadas para los compradores coincidentes del CRM.

Responde en JSON con esta estructura exactas:
{
  "answer": "Paquete de exponenciación preparado con éxito",
  "package": {
    "reelScript": {
      "hook": "¡No compres casa en [Zona] hasta ver este detalle!",
      "body": "Esta propiedad de [Habitaciones] habs y [Baños] baños cuenta con...",
      "cta": "Comenta 'VER' para enviarte la ficha completa por privado",
      "caption": "Copy para el Reel...",
      "hashtags": ["#BienesRaices", "#ElSalvador", "#CasasEnVenta"]
    },
    "whatsAppBroadcast": "🏡 *NUEVA PROPIEDAD EN VENTA*\n...",
    "facebookMarketplaceCopy": "Excelente opción residencial en zona exclusiva...",
    "leadMagnetKeyword": "CASA",
    "directOutreachTemplates": [
      {
        "buyerName": "Nombre Comprador",
        "buyerDemandId": "id",
        "matchScore": 85,
        "personalizedMessage": "Hola [Nombre], según tu búsqueda de casa en [Zona], acaba de ingresar..."
      }
    ]
  }
}`;

  const res = await socialAmplifierAgent.execute(prompt);
  const pkg = (res.data as { package?: AmplificationPackage })?.package;

  if (pkg) return pkg;

  return {
    reelScript: {
      hook: `✨ ¿Buscas propiedad en ${propertyData.location || "excelente ubicación"}?`,
      body: `${propertyData.title} por ${propertyData.price ? "$" + propertyData.price.toLocaleString() : "precio especial"}.`,
      cta: "Escribe WhatsApp para agendar tu visita hoy.",
      caption: `Descubre ${propertyData.title}. ¡Contáctanos!`,
      hashtags: ["#Inmobiliaria", "#Propiedades", "#BienesRaices"],
    },
    whatsAppBroadcast: `🏡 *${propertyData.title}*\n📍 *Ubicación:* ${propertyData.location}\n💰 *Precio:* ${propertyData.price ? "$" + propertyData.price.toLocaleString() : "Consultar"}\n\n📲 *Más información:* ¡Escríbenos directamente!`,
    facebookMarketplaceCopy: `${propertyData.title} en ${propertyData.location}. Excelente oportunidad de inversión. Contacta para más detalles.`,
    leadMagnetKeyword: "INFO",
    directOutreachTemplates: matchedDemands.map((m) => ({
      buyerName: m.name,
      buyerDemandId: m.id,
      matchScore: m.score,
      personalizedMessage: `Hola ${m.name}, tenemos una propiedad que coincide un ${m.score}% con lo que buscas: ${propertyData.title}. ¿Te comparto los detalles?`,
    })),
  };
}

export { socialAmplifierAgent };
