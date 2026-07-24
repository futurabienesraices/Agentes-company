import { NextResponse } from "next/server";

const COOKIE_NAME = "futura_session";
const SESSION_VALUE = "futura-authorized";

async function signature(secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_VALUE));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const accessCode = process.env.FUTURA_ACCESS_CODE;
  const sessionSecret = process.env.FUTURA_SESSION_SECRET;
  if (!accessCode || !sessionSecret) return NextResponse.json({ error: "La protección privada todavía no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as { code?: string };
    if (!body.code || body.code !== accessCode) return NextResponse.json({ error: "Código incorrecto." }, { status: 401, headers: { "Cache-Control": "no-store" } });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, await signature(sessionSecret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 400 });
  }
}
