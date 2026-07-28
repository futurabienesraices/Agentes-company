import { NextResponse } from "next/server";
import { createDailySalesPlan, getSalesCockpit } from "../../../lib/sales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

export async function GET() {
  const cockpit = await getSalesCockpit();
  return NextResponse.json(cockpit, {
    status: cockpit.connected ? 200 : 503,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  try {
    const result = await createDailySalesPlan();
    return NextResponse.json({
      ...result,
      message: result.created
        ? `Se crearon ${result.created} tareas para la jornada comercial de hoy.`
        : "La jornada comercial de hoy ya estaba creada.",
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error("No se pudo crear la jornada de ventas", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear la jornada." }, { status: 500 });
  }
}
