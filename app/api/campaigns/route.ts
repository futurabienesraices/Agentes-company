import { NextResponse } from "next/server";
import { CAMPAIGN_STATUSES, createCampaign, listCampaigns, updateCampaign, type CampaignInput, type CampaignStatus } from "../../../lib/campaigns";

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

function validStatus(status: unknown): status is CampaignStatus { return CAMPAIGN_STATUSES.includes(status as CampaignStatus); }

export async function GET() {
  try { return json({ campaigns: await listCampaigns() }); }
  catch (error) {
    console.error("No se pudieron cargar las campañas", error);
    return json({ error: "No se pudieron cargar las campañas." }, 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origen no autorizado." }, 403);
  try {
    const input = (await request.json()) as Partial<CampaignInput>;
    if (!input.title?.trim() || !input.property?.trim() || !validStatus(input.status)) return json({ error: "La campaña necesita propiedad, título y estado válidos." }, 400);
    if (input.status === "Programada" && !input.scheduledFor) return json({ error: "Indica fecha y hora para programar la campaña." }, 400);
    if (input.title.length > 180 || input.property.length > 180 || (input.angle?.length || 0) > 600) return json({ error: "Uno de los campos excede el límite permitido." }, 400);
    const campaign = await createCampaign({
      title: input.title.trim(), propertyId: input.propertyId || "", property: input.property.trim(), status: input.status,
      scheduledFor: input.scheduledFor || "", channels: Array.isArray(input.channels) ? input.channels.filter((item): item is string => typeof item === "string").slice(0, 12) : [],
      objective: input.objective || "", angle: input.angle || "", plan: input.plan || null,
    });
    return json({ campaign }, 201);
  } catch (error) {
    console.error("No se pudo crear la campaña", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo crear la campaña." }, 500);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origen no autorizado." }, 403);
  try {
    const input = (await request.json()) as { id?: string; status?: CampaignStatus; scheduledFor?: string };
    if (!input.id?.startsWith("rec") || !validStatus(input.status)) return json({ error: "Campaña o estado inválido." }, 400);
    if (input.status === "Programada" && !input.scheduledFor) return json({ error: "Una campaña programada requiere fecha y hora." }, 400);
    return json({ campaign: await updateCampaign(input.id, { status: input.status, scheduledFor: input.scheduledFor }) });
  } catch (error) {
    console.error("No se pudo actualizar la campaña", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo actualizar la campaña." }, 500);
  }
}
