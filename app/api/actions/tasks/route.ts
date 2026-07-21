import { NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TASKS_TABLE = "tblP1NK4FnlO5pHTr";
const FIELDS = {
  name: "fldZXN2c7B9pHKQbz",
  status: "fldF1T4stbMxv5sbm",
  priority: "fldd3t4Kn7NasxlNx",
  dueAt: "fldpuv4cHJ5XfivND",
};

type RequestBody = {
  title?: string;
  dueAt?: string;
  priority?: string;
};

export async function POST(request: Request) {
  if (!API_TOKEN) return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const title = body.title?.trim();
    if (!title) return NextResponse.json({ error: "Falta el nombre de la tarea." }, { status: 400 });

    const fields: Record<string, string> = {
      [FIELDS.name]: title,
      [FIELDS.status]: "Pendiente",
      [FIELDS.priority]: body.priority?.trim() || "Media",
    };
    if (body.dueAt) fields[FIELDS.dueAt] = body.dueAt;

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TASKS_TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("No se pudo crear la tarea en Airtable", payload);
      return NextResponse.json({ error: "No se pudo crear la tarea en Airtable." }, { status: 502 });
    }

    const record = payload?.records?.[0];
    return NextResponse.json({
      ok: true,
      id: record?.id,
      message: `Tarea creada: ${title}${body.dueAt ? ` para ${body.dueAt}` : ""}.`,
    });
  } catch (error) {
    console.error("Error creando tarea", error);
    return NextResponse.json({ error: "No se pudo procesar la acción." }, { status: 500 });
  }
}
