import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const OPERATIONS = {
  followUp: {
    table: "tbl5G7PfXax3WafYE",
    fields: {
      status: "fldmE4yR7BznYlT36",
      result: "fldyJtLLHMjKPbCOo",
      nextAction: "fldNrTzmiZlZokwkv",
      dueAt: "fldCStsSMMq6MPsVv",
    },
  },
  visit: {
    table: "tblOsY6wXA3L6PZtV",
    fields: {
      status: "fldfiVykzucG4N0C8",
      result: "fldZ5BDr1aOJ627px",
      date: "fldwAKwmRAiRnW6zL",
    },
  },
  publication: {
    table: "tblEmH9qmv71N6YNC",
    fields: {
      status: "fld4VPWXT1Hn6p5jA",
      channel: "fldyyNpqVPFLQ66MI",
      url: "fldR0akwSUt1avs0x",
      date: "fldKMGodj9Z0Q3Pu8",
    },
  },
  offer: {
    table: "tblrsZAPjijpSLHpC",
    fields: {
      status: "fldLRwtXEWkOVsEvY",
      notes: "flde3FxNwn8hrZ4CP",
    },
  },
} as const;

type Entity = keyof typeof OPERATIONS;

const isRecordId = (value: unknown): value is string =>
  typeof value === "string" && /^rec[A-Za-z0-9]{14}$/.test(value);

export async function PATCH(request: NextRequest) {
  if (!API_TOKEN) {
    return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const entity = body.entity as Entity;
    const operation = OPERATIONS[entity];

    if (!operation || !isRecordId(body.recordId)) {
      return NextResponse.json({ error: "Operación o registro inválido." }, { status: 400 });
    }

    const incoming = body.fields;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      return NextResponse.json({ error: "No hay cambios válidos." }, { status: 400 });
    }

    const allowedFields = operation.fields as Record<string, string>;
    const fields: Record<string, string> = {};

    for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
      const fieldId = allowedFields[key];
      if (!fieldId || typeof value !== "string") continue;
      const cleanValue = value.trim();
      if (cleanValue) fields[fieldId] = cleanValue;
    }

    if (!Object.keys(fields).length) {
      return NextResponse.json({ error: "Ningún campo permitido fue enviado." }, { status: 400 });
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${operation.table}/${body.recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields, typecast: true }),
      },
    );

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: "Airtable rechazó la actualización.", detail: result },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, record: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar el registro." },
      { status: 500 },
    );
  }
}
