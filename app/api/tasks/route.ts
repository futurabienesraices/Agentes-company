import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLE_ID = "tblP1NK4FnlO5pHTr";
const FIELDS = {
  name: "fldZXN2c7B9pHKQbz",
  status: "fldF1T4stbMxv5sbm",
  priority: "fldd3t4Kn7NasxlNx",
  dueAt: "fldpuv4cHJ5XfivND",
};

export async function POST(request: NextRequest) {
  if (!API_TOKEN) return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const priority = typeof body.priority === "string" ? body.priority : "Alta";
    const dueAt = typeof body.dueAt === "string" ? body.dueAt : new Date().toISOString().slice(0, 10);
    if (!name) return NextResponse.json({ error: "La tarea necesita un nombre." }, { status: 400 });

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ typecast: true, records: [{ fields: {
        [FIELDS.name]: name,
        [FIELDS.status]: "Pendiente",
        [FIELDS.priority]: priority,
        [FIELDS.dueAt]: dueAt,
      } }] }),
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Airtable rechazó la tarea.", detail: result }, { status: response.status });
    return NextResponse.json({ ok: true, record: result.records?.[0] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible crear la tarea." }, { status: 500 });
  }
}
