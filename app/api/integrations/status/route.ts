/**
 * Diagnostic Health Check Endpoint — Futura OS
 * Checks status of all external services & environment variables.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const envChecks = [
    {
      key: "AIRTABLE_API_TOKEN",
      name: "Airtable Operational DB",
      configured: Boolean(process.env.AIRTABLE_API_TOKEN),
      required: true,
      description: "Almacenamiento de propiedades, leads, tareas y memoria de prospectos.",
    },
    {
      key: "GEMINI_API_KEY",
      name: "Gemini AI (Futura IA)",
      configured: Boolean(process.env.GEMINI_API_KEY),
      required: true,
      description: "Motor de razonamiento para el Director IA y generación de copys.",
    },
    {
      key: "META_GRAPH_TOKEN",
      name: "Meta Graph API (FB & Instagram)",
      configured: Boolean(process.env.META_GRAPH_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN),
      required: false,
      description: "Publicación automática de posts y reels en Facebook e Instagram.",
    },
    {
      key: "TELEGRAM_BOT_TOKEN",
      name: "Bot Multiagente de Telegram",
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      required: false,
      description: "Interacción con Camila (Contenido), Víctor (Ventas) y Pixel (Reels).",
    },
    {
      key: "CLOUDINARY_CLOUD_NAME",
      name: "Cloudinary Media Library",
      configured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      required: false,
      description: "Almacenamiento y optimización de fotos/videos de inmuebles.",
    },
    {
      key: "CREATOMATE_API_KEY",
      name: "Creatomate Reels Generator",
      configured: Boolean(process.env.CREATOMATE_API_KEY),
      required: false,
      description: "Renderizado de video Reels MP4 automatizados.",
    },
    {
      key: "FUTURA_ACCESS_CODE",
      name: "Protección de Acceso / Auth",
      configured: Boolean(process.env.FUTURA_ACCESS_CODE && process.env.FUTURA_SESSION_SECRET),
      required: true,
      description: "Seguridad y bloqueo del dashboard contra accesos no autorizados.",
    },
  ];

  const configuredCount = envChecks.filter((c) => c.configured).length;
  const healthPercentage = Math.round((configuredCount / envChecks.length) * 100);

  return NextResponse.json({
    healthPercentage,
    configuredCount,
    totalCount: envChecks.length,
    services: envChecks,
  });
}
