/**
 * Webhook Security Utilities — Futura OS
 * Verifies authenticity of inbound webhooks from Telegram, Meta (FB/IG) and WhatsApp.
 */

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Safe timing comparison for strings or buffers
 */
function safeTimingEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 1. Verify Telegram Webhook Secret Token
 * Telegram sends header: X-Telegram-Bot-Api-Secret-Token
 */
export function verifyTelegramWebhook(request: Request): { valid: boolean; response?: NextResponse } {
  const secretEnv = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Si la variable no está configurada, se permite el paso con advertencia.
  // Configura TELEGRAM_WEBHOOK_SECRET en Vercel para activar la verificación estricta.
  if (!secretEnv) {
    console.warn("⚠️ [Telegram Webhook] TELEGRAM_WEBHOOK_SECRET no configurada — verificación deshabilitada.");
    return { valid: true };
  }

  const incomingToken = request.headers.get("x-telegram-bot-api-secret-token") || "";

  if (!incomingToken || !safeTimingEqual(incomingToken, secretEnv)) {
    console.warn("⚠️ [Telegram Webhook] Token inválido o faltante.");
    return {
      valid: false,
      response: NextResponse.json({ error: "Token de webhook no autorizado." }, { status: 401 }),
    };
  }

  return { valid: true };
}

/**
 * 2. Verify Meta (Facebook/Instagram/WhatsApp Cloud API) Verification GET Request
 */
export function verifyMetaChallenge(request: Request): NextResponse {
  const verifyTokenEnv = process.env.META_VERIFY_TOKEN;

  if (!verifyTokenEnv) {
    console.warn("⚠️ [Seguridad Webhook] META_VERIFY_TOKEN no configurada. Rechazando verificación de Meta.");
    return NextResponse.json({ error: "Verify token no configurado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token") || "";
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && safeTimingEqual(token, verifyTokenEnv) && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("⚠️ [Seguridad Webhook] Desafío de verificación de Meta inválido o token incorrecto.");
  return NextResponse.json({ error: "Verificación de webhook fallida." }, { status: 403 });
}

/**
 * 3. Verify Meta (Facebook/Instagram/WhatsApp Cloud API) HMAC SHA-256 Signature POST Request
 * Header: X-Hub-Signature-256 (format: sha256=<hex_hash>)
 */
export function verifyMetaSignature(rawBody: string, request: Request): { valid: boolean; response?: NextResponse } {
  const appSecretEnv = process.env.META_APP_SECRET;

  if (!appSecretEnv) {
    console.warn("⚠️ [Seguridad Webhook] META_APP_SECRET no configurada. Rechazando webhook de Meta.");
    return {
      valid: false,
      response: NextResponse.json({ error: "Secreto de aplicación no configurado." }, { status: 403 }),
    };
  }

  const signatureHeader = request.headers.get("x-hub-signature-256") || "";

  if (!signatureHeader.startsWith("sha256=")) {
    console.warn("⚠️ [Seguridad Webhook] Encabezado X-Hub-Signature-256 faltante o con formato inválido.");
    return {
      valid: false,
      response: NextResponse.json({ error: "Firma de webhook faltante o inválida." }, { status: 403 }),
    };
  }

  const incomingHashHex = signatureHeader.slice(7);
  const expectedHashHex = crypto.createHmac("sha256", appSecretEnv).update(rawBody, "utf-8").digest("hex");

  if (!safeTimingEqual(incomingHashHex, expectedHashHex)) {
    console.warn("⚠️ [Seguridad Webhook] Firma HMAC SHA-256 de Meta no coincide.");
    return {
      valid: false,
      response: NextResponse.json({ error: "Firma de webhook rechazada." }, { status: 403 }),
    };
  }

  return { valid: true };
}
