import { NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const LEADS_TABLE = "tblUxwYmD7Gliahzs";
const FIELDS = {
  name: "fldA9qI2kUKyv64JY",
  classification: "fldgS0dl95nJxdrE0",
  priority: "fldshPdum09OCTKW3",
  response: "fld6kfblYoaareLKg",
  enteredAt: "fldgb694pdT82sI8D",
};

type Prospect = {
  name: string;
  type?: string;
  sourceUrl?: string;
  reason?: string;
  channel?: string;
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

async function existingNames() {
  const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true", fields: FIELDS.name });
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${LEADS_TABLE}?${params}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
  const payload = (await response.json()) as { records?: AirtableRecord[] };
  return new Set((payload.records ?? []).map((record) => String(record.fields[FIELDS.name] ?? "").trim().toLowerCase()).filter(Boolean));
}

export async function POST(request: Request) {
  if (!API_TOKEN) return NextResponse.json({ error: "AIRTABLE_API_TOKEN no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as { prospects?: Prospect[] };
    const prospects = (body.prospects ?? []).filter((item) => item.name?.trim()).slice(0, 10);
    if (!prospects.length) return NextResponse.json({ error: "No hay prospectos seleccionados." }, { status: 400 });

    const names = await existingNames();
    const unique = prospects.filter((item) => !names.has(item.name.trim().toLowerCase()));
    const duplicates = prospects.length - unique.length;

    if (!unique.length) {
      return NextResponse.json({ message: `No se agregaron registros: los ${duplicates} prospectos ya existían en el CRM.`, created: 0, duplicates });
    }

    const today = new Date().toISOString().slice(0, 10);
    const records = unique.map((prospect) => ({
      fields: {
        [FIELDS.name]: prospect.name.trim(),
        [FIELDS.classification]: "Nuevo",
        [FIELDS.priority]: "Media",
        [FIELDS.response]: "Pendiente",
        [FIELDS.enteredAt]: today,
      },
    }));

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${LEADS_TABLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records, typecast: true }),
    });
    const payload = await response.json();
    if (!response.ok) {
      console.error("No se pudieron guardar prospectos", payload);
      return NextResponse.json({ error: "Airtable rechazó los prospectos seleccionados." }, { status: 502 });
    }

    return NextResponse.json({
      message: `Se agregaron ${unique.length} prospectos al CRM${duplicates ? ` y se omitieron ${duplicates} duplicados` : ""}.`,
      created: unique.length,
      duplicates,
    });
  } catch (error) {
    console.error("Error guardando prospectos", error);
    return NextResponse.json({ error: "No se pudieron guardar los prospectos." }, { status: 500 });
  }
}
