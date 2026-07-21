import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WEBHOOK_URL = process.env.TWILIO_WEBHOOK_URL;

const TABLES = {
  propiedades: "tblZifOElWQtGaXHM",
  personas: "tblmDGwNAVcYnUAnW",
  leads: "tblUxwYmD7Gliahzs",
  seguimientos: "tbl5G7PfXax3WafYE",
};

const FIELDS = {
  propiedades: {
    code: "fldBHH1Ki3jmVIGwB",
    title: "fldcDIOahahyHurDm",
    type: "fldzkccNuERBm2Ybq",
    operation: "fldm7rV2anSTjGpgp",
    price: "fldvcBlG4w3yfUYIy",
    zone: "fldcvNHcJkzuYhs6a",
    municipality: "fldujbgyGoy7aSuwT",
    status: "fldj9molLkGpK6SXR",
    bedrooms: "fldOkU0sslGhy1aWj",
    bathrooms: "fldAqffjwsOVxNp7A",
    maps: "fldweiA3loiTEq5XH",
    video: "fldiuy6xBIR8DitBV",
  },
  personas: {
    name: "fldJkHjV0rXKkEqIH",
    phone: "fldWBr2kdR2vp6VAH",
    relation: "flddcozryg3AGcfPR",
    status: "fldDF3XWHUNg3IxiB",
    source: "fld3LdFD1yfVQ37iy",
    firstContact: "fldWp1iBQbMrHsCWu",
    priority: "fld8xTtELef1jE5sX",
    notes: "fldApr2IshWNFVNpZ",
  },
  leads: {
    name: "fldA9qI2kUKyv64JY",
    notes: "fldPFyDntNAI5Dcwk",
    status: "fldFhHbDVQyBsqujj",
    person: "fld1s5rX2XeHh1Gpd",
    phone: "fldBAVL33laSAVf1q",
    classification: "fldgS0dl95nJxdrE0",
    channel: "flduBfRO0rLLZq1WD",
    date: "fldgb694pdT82sI8D",
    priority: "fldshPdum09OCTKW3",
    response: "fld6kfblYoaareLKg",
  },
  seguimientos: {
    name: "fldXsuexoOflUM3e8",
    notes: "fldPkefB3ayIzmtx7",
    status: "fldmE4yR7BznYlT36",
    person: "fldozfWMEWoR7o4xO",
    nextAction: "fldNrTzmiZlZokwkv",
    dueAt: "fldCStsSMMq6MPsVv",
  },
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

const todayManila = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character] ?? character);
}

function twiml(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

async function airtable(path: string, init?: RequestInit) {
  if (!AIRTABLE_TOKEN) throw new Error("Airtable no está configurado.");
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Airtable rechazó la solicitud.");
  return result;
}

async function createRecord(table: string, fields: Record<string, unknown>) {
  const result = await airtable(table, {
    method: "POST",
    body: JSON.stringify({ typecast: true, records: [{ fields }] }),
  });
  return result.records?.[0] as AirtableRecord;
}

async function findPersonByPhone(phone: string) {
  const formula = encodeURIComponent(`{Teléfono}='${phone.replace(/'/g, "\\'")}'`);
  const result = await airtable(`${TABLES.personas}?maxRecords=1&filterByFormula=${formula}`);
  return result.records?.[0] as AirtableRecord | undefined;
}

async function ensureLead(phone: string, inboundMessage: string) {
  const today = todayManila();
  let person = await findPersonByPhone(phone);

  if (!person) {
    person = await createRecord(TABLES.personas, {
      [FIELDS.personas.name]: `Contacto WhatsApp ${phone}`,
      [FIELDS.personas.phone]: phone,
      [FIELDS.personas.relation]: ["Comprador"],
      [FIELDS.personas.status]: "Prospecto",
      [FIELDS.personas.source]: "WhatsApp",
      [FIELDS.personas.firstContact]: today,
      [FIELDS.personas.priority]: "Alta",
      [FIELDS.personas.notes]: `Primer mensaje: ${inboundMessage.slice(0, 800)}`,
    });

    await createRecord(TABLES.leads, {
      [FIELDS.leads.name]: `WhatsApp · ${phone}`,
      [FIELDS.leads.notes]: inboundMessage.slice(0, 1000),
      [FIELDS.leads.status]: "Activo",
      [FIELDS.leads.person]: [person.id],
      [FIELDS.leads.phone]: phone,
      [FIELDS.leads.classification]: "Nuevo",
      [FIELDS.leads.channel]: "WhatsApp",
      [FIELDS.leads.date]: today,
      [FIELDS.leads.priority]: "Alta",
      [FIELDS.leads.response]: "Respondido",
    });

    await createRecord(TABLES.seguimientos, {
      [FIELDS.seguimientos.name]: `Calificar contacto WhatsApp ${phone}`,
      [FIELDS.seguimientos.notes]: `Mensaje inicial: ${inboundMessage.slice(0, 800)}`,
      [FIELDS.seguimientos.status]: "Todo",
      [FIELDS.seguimientos.person]: [person.id],
      [FIELDS.seguimientos.nextAction]: "Validar necesidad, presupuesto, ubicación y fecha estimada de compra o alquiler.",
      [FIELDS.seguimientos.dueAt]: today,
    });
  }

  return person;
}

function display(value: unknown) {
  if (value && typeof value === "object" && "name" in value) return String((value as { name: unknown }).name);
  return value == null ? "" : String(value);
}

async function getInventory() {
  const fieldIds = Object.values(FIELDS.propiedades);
  const query = fieldIds.map((id) => `fields%5B%5D=${id}`).join("&");
  const result = await airtable(`${TABLES.propiedades}?maxRecords=20&${query}`);
  const closedWords = ["vendida", "alquilada", "cerrada", "archivada", "inactiva"];

  return (result.records as AirtableRecord[])
    .filter((record) => {
      const status = display(record.fields[FIELDS.propiedades.status]).toLowerCase();
      return !closedWords.some((word) => status.includes(word));
    })
    .slice(0, 12)
    .map((record) => ({
      id: record.id,
      code: display(record.fields[FIELDS.propiedades.code]),
      title: display(record.fields[FIELDS.propiedades.title]),
      type: display(record.fields[FIELDS.propiedades.type]),
      operation: display(record.fields[FIELDS.propiedades.operation]),
      price: record.fields[FIELDS.propiedades.price] ?? null,
      zone: display(record.fields[FIELDS.propiedades.zone]),
      municipality: display(record.fields[FIELDS.propiedades.municipality]),
      bedrooms: record.fields[FIELDS.propiedades.bedrooms] ?? null,
      bathrooms: record.fields[FIELDS.propiedades.bathrooms] ?? null,
      maps: display(record.fields[FIELDS.propiedades.maps]),
      video: display(record.fields[FIELDS.propiedades.video]),
    }));
}

async function generateReply(message: string, phone: string, inventory: unknown[]) {
  if (!OPENAI_API_KEY) {
    return "¡Hola! Soy el asistente de Futura Bienes Raíces. ¿Busca comprar, alquilar o vender? Indíqueme también la zona y su presupuesto aproximado.";
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: [
        "Eres el asistente virtual de ventas de Futura Bienes Raíces.",
        "Responde en español claro, amable y breve, con máximo 500 caracteres.",
        "Tu objetivo es calificar al cliente: operación, tipo de propiedad, ubicación, presupuesto, habitaciones y plazo.",
        "Solo menciona propiedades incluidas en INVENTARIO. Nunca inventes disponibilidad, precio, dirección ni condiciones.",
        "Si falta información, haz una sola pregunta útil por mensaje.",
        "Si el cliente desea visitar, negociar, ofertar o hablar con una persona, confirma que un asesor continuará y escribe la palabra interna [HUMANO] al final.",
        "No des asesoría legal ni financiera definitiva.",
      ].join(" "),
      input: `Teléfono: ${phone}\nMensaje: ${message}\nINVENTARIO: ${JSON.stringify(inventory)}`,
      max_output_tokens: 180,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "OpenAI no pudo generar la respuesta.");
  const text = result.output_text || result.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text).filter(Boolean).join(" ");
  return String(text || "¿Busca comprar, alquilar o vender, y en qué zona?").replace(/\s*\[HUMANO\]\s*/g, "").trim();
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Futura WhatsApp Assistant",
    configured: Boolean(AIRTABLE_TOKEN && TWILIO_AUTH_TOKEN && TWILIO_WEBHOOK_URL),
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const params = Object.fromEntries(new URLSearchParams(rawBody));
    const signature = request.headers.get("x-twilio-signature") ?? "";

    if (!TWILIO_AUTH_TOKEN || !TWILIO_WEBHOOK_URL) {
      return new NextResponse(twiml("El asistente todavía no está configurado."), {
        status: 503,
        headers: { "Content-Type": "text/xml" },
      });
    }

    if (!twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, TWILIO_WEBHOOK_URL, params)) {
      return NextResponse.json({ error: "Firma de Twilio inválida." }, { status: 403 });
    }

    const message = String(params.Body ?? "").trim().slice(0, 1500);
    const phone = String(params.From ?? "").replace(/^whatsapp:/, "").trim();
    if (!message || !phone) return new NextResponse(twiml("No pude leer el mensaje. Intente nuevamente."), { headers: { "Content-Type": "text/xml" } });

    await ensureLead(phone, message);
    const inventory = await getInventory();
    const reply = await generateReply(message, phone, inventory);

    return new NextResponse(twiml(reply), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("WhatsApp assistant error", error);
    return new NextResponse(twiml("Gracias por escribir. Un asesor de Futura Bienes Raíces continuará su atención lo antes posible."), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
