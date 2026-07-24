import { NextResponse } from "next/server";
import { createGrowthOpportunity, detectGrowthOpportunities, listGrowthOpportunities, updateGrowthOpportunity, type GrowthInput } from "../../../lib/growth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

export async function GET() {
  try {
    const opportunities = await listGrowthOpportunities();
    return json({ opportunities });
  } catch (error) {
    console.error("No se pudo cargar Growth AI", error);
    return json({ error: "No se pudo cargar el backlog de crecimiento." }, 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origen no autorizado." }, 403);

  try {
    const body = (await request.json()) as { action?: "detect" | "create"; opportunity?: GrowthInput };
    if (body.action === "detect") {
      const result = await detectGrowthOpportunities();
      return json({ ...result, message: result.created.length ? `${result.created.length} oportunidades nuevas detectadas.` : "El backlog ya incluye las oportunidades operativas actuales." });
    }

    if (!body.opportunity?.title?.trim()) return json({ error: "Escribe el nombre de la oportunidad." }, 400);
    if (body.opportunity.title.length > 180) return json({ error: "El nombre es demasiado largo." }, 400);
    const opportunity = await createGrowthOpportunity(body.opportunity);
    return json({ opportunity, message: "Oportunidad añadida y priorizada." });
  } catch (error) {
    console.error("No se pudo actualizar Growth AI", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo procesar la oportunidad." }, 500);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origen no autorizado." }, 403);

  try {
    const body = (await request.json()) as { id?: string; changes?: Partial<GrowthInput> };
    if (!body.id || !body.changes) return json({ error: "Faltan datos para actualizar la oportunidad." }, 400);
    const opportunity = await updateGrowthOpportunity(body.id, body.changes);
    return json({ opportunity, message: "Oportunidad actualizada." });
  } catch (error) {
    console.error("No se pudo actualizar la oportunidad", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo actualizar la oportunidad." }, 500);
  }
}
