import { NextRequest, NextResponse } from "next/server";
import { recalculateAirtableMatches } from "../../../../lib/airtable-matching";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.MATCHING_API_SECRET;
  const providedSecret = request.headers.get("x-matching-secret");

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Falta configurar MATCHING_API_SECRET." },
      { status: 503 },
    );
  }

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { demandId?: unknown };
    const demandId = typeof body.demandId === "string" ? body.demandId : undefined;
    const result = await recalculateAirtableMatches(demandId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("No fue posible recalcular coincidencias", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido." },
      { status: 500 },
    );
  }
}
