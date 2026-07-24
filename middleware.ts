import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "futura_session";
const SESSION_VALUE = "futura-authorized";

async function signature(secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_VALUE));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const accessCode = process.env.FUTURA_ACCESS_CODE;
  const sessionSecret = process.env.FUTURA_SESSION_SECRET;

  // La protección es optativa para no bloquear instalaciones existentes.
  // Al configurar ambas variables, todo el panel y las APIs quedan privados.
  if (!accessCode || !sessionSecret) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const publicPath = path === "/login" || path === "/api/auth/login" || path === "/manifest.webmanifest" || path === "/sw.js" || path === "/icon.svg";
  if (publicPath || path.startsWith("/_next/")) return NextResponse.next();

  const expected = await signature(sessionSecret);
  const current = request.cookies.get(COOKIE_NAME)?.value;
  if (current === expected) return NextResponse.next();

  if (path.startsWith("/api/")) return NextResponse.json({ error: "Sesión requerida." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const login = new URL("/login", request.url);
  login.searchParams.set("next", path);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
