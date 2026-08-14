import { NextResponse } from "next/server";
import { addProspectMemory, getProspectingData, LEGAL_BASES, PROSPECTING_SOURCES, type ProspectMemoryInput } from "../../../lib/prospecting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store, max-age=0" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

export async function GET() {
  try { return json(await getProspectingData()); }
  catch (error) {
    console.error("No se pudo cargar prospecting", error);
    return json({ error: "No se pudo cargar la memoria de prospectos." }, 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origen no autorizado." }, 403);
  try {
    const input = (await request.json()) as Partial<ProspectMemoryInput>;
    if (!input.title?.trim() || !input.prospect?.trim() || !input.summary?.trim()) return json({ error: "Completa el prospecto, el hallazgo y la evidencia." }, 400);
    if (input.title.length > 180 || input.prospect.length > 180 || input.summary.length > 2000) return json({ error: "Uno de los campos excede el límite permitido." }, 400);
    if (!PROSPECTING_SOURCES.includes(input.source as never) || !LEGAL_BASES.includes(input.legalBasis as never)) return json({ error: "Selecciona un origen y una base de uso válidos." }, 400);
    if (input.url && !/^https?:\/\//i.test(input.url)) return json({ error: "La URL debe iniciar con http:// o https://." }, 400);
    const memory = await addProspectMemory({
      title: input.title,
      prospect: input.prospect,
      source: input.source as ProspectMemoryInput["source"],
      event: input.event?.trim() || "Descubierto",
      summary: input.summary,
      url: input.url || "",
      confidence: Number(input.confidence) || 0,
      score: Number(input.score) || 0,
      recommendedAction: input.recommendedAction || "Validar sitio web y decidir si requiere contacto humano.",
      legalBasis: input.legalBasis as ProspectMemoryInput["legalBasis"],
    });
    return json({ memory, message: "Hallazgo guardado en la memoria del prospecto." }, 201);
  } catch (error) {
    console.error("No se pudo guardar la memoria de prospecto", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo guardar el hallazgo." }, 500);
  }
}
