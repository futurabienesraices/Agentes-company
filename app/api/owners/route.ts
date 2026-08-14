import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TIME_ZONE = process.env.FUTURA_TIME_ZONE ?? "America/Guatemala";

const TABLES = {
  properties: "tblZifOElWQtGaXHM",
  people: "tblmDGwNAVcYnUAnW",
  leads: "tblUxwYmD7Gliahzs",
  followUps: "tbl5G7PfXax3WafYE",
};

const F = {
  people: {
    name: "fldJkHjV0rXKkEqIH", phone: "fldWBr2kdR2vp6VAH", email: "fld7TYCurdbXo74x8",
    relation: "flddcozryg3AGcfPR", status: "fldDF3XWHUNg3IxiB", notes: "fldApr2IshWNFVNpZ",
    source: "fld3LdFD1yfVQ37iy", first: "fldWp1iBQbMrHsCWu", priority: "fld8xTtELef1jE5sX",
    contactType: "fldtVbO5bo6Qs5I9f",
  },
  properties: {
    code: "fldBHH1Ki3jmVIGwB", title: "fldcDIOahahyHurDm", notes: "fldFLfIbFiHexwlS3",
    type: "fldzkccNuERBm2Ybq", operation: "fldm7rV2anSTjGpgp", price: "fldvcBlG4w3yfUYIy",
    area: "fldd6e2CkUyHE3XY1", bedrooms: "fldOkU0sslGhy1aWj", bathrooms: "fldAqffjwsOVxNp7A",
    parking: "fldkHChhExIt7bWCC", zone: "fldcvNHcJkzuYhs6a", municipality: "fldujbgyGoy7aSuwT",
    department: "fldib9LITBoAOcTIu", status: "fldj9molLkGpK6SXR", owner: "fldZKOy34TIA7TamB",
    missing: "fldcTVWJJ2USr5Lmq", commercialStatus: "fldAN7GBFy247BShJ", legalStatus: "fld9MQpCJwsn1UuQF",
    priority: "fldwKZGKdEybym5z9", source: "fldKSrym3QBoS3vXO", enteredAt: "fldYJOU6bLzHPxu3n",
    commercialNotes: "fldwQc2H0R0g2zJqW",
  },
  leads: {
    name: "fldA9qI2kUKyv64JY", notes: "fldPFyDntNAI5Dcwk", status: "fldFhHbDVQyBsqujj",
    person: "fld1s5rX2XeHh1Gpd", phone: "fldBAVL33laSAVf1q", classification: "fldgS0dl95nJxdrE0",
    channel: "flduBfRO0rLLZq1WD", date: "fldgb694pdT82sI8D", property: "fldfVr7EtQldjfpSz",
    priority: "fldshPdum09OCTKW3", response: "fld6kfblYoaareLKg", stage: "fldwlapkEP4rEJlnl",
  },
  followUps: {
    name: "fldXsuexoOflUM3e8", notes: "fldPkefB3ayIzmtx7", status: "fldmE4yR7BznYlT36",
    person: "fldozfWMEWoR7o4xO", property: "fldt4Jw0DSnvQWcfW", next: "fldNrTzmiZlZokwkv",
    due: "fldCStsSMMq6MPsVv",
  },
} as const;

type AirtableRecord = { id: string };
const recentRequests = new Map<string, number[]>();

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function positiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function dateInZone(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return dateInZone(date);
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

function withinLimit(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const active = (recentRequests.get(key) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (active.length >= 5) return false;
  active.push(now);
  recentRequests.set(key, active);
  return true;
}

async function create(table: string, fields: Record<string, unknown>) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ typecast: true, records: [{ fields }] }),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Airtable rechazó el registro.");
  return payload.records?.[0] as AirtableRecord;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  if (!withinLimit(request)) return NextResponse.json({ error: "Has enviado varias solicitudes. Intenta más tarde." }, { status: 429 });
  if (!API_TOKEN) return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });

  try {
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website)) return NextResponse.json({ ok: true });

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 120);
    const location = clean(body.location, 220);
    const municipality = clean(body.municipality, 120);
    const department = clean(body.department, 120);
    const message = clean(body.message, 1500);
    const urgency = clean(body.urgency, 40) || "1-3 meses";
    const consent = Boolean(body.consent);

    if (!consent) return NextResponse.json({ error: "Necesitamos tu autorización para contactarte." }, { status: 400 });
    if (!name || (!phone && !email) || !location) {
      return NextResponse.json({ error: "Indica tu nombre, una forma de contacto y la ubicación de la propiedad." }, { status: 400 });
    }

    const allowedOperations = ["Venta", "Alquiler", "Venta/Alquiler"];
    const operation = allowedOperations.includes(clean(body.operation, 30)) ? clean(body.operation, 30) : "Venta";
    const allowedTypes = ["Casa", "Apartamento", "Terreno", "Local comercial", "Oficina", "Bodega", "Edificio", "Finca"];
    const propertyType = allowedTypes.includes(clean(body.propertyType, 60)) ? clean(body.propertyType, 60) : "Casa";
    const priority = urgency === "Esta semana" ? "Alta" : urgency === "Este mes" ? "Alta" : "Media";
    const leadPriority = urgency === "Esta semana" ? "Urgente" : urgency === "Este mes" ? "Alta" : "Media";
    const today = dateInZone();
    const reference = `CAP-${today.replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const relation = operation === "Alquiler" ? ["Propietario", "Arrendador"] : operation === "Venta/Alquiler" ? ["Propietario", "Vendedor", "Arrendador"] : ["Propietario", "Vendedor"];
    const expectedPrice = positiveNumber(body.expectedPrice);
    const area = positiveNumber(body.area);
    const bedrooms = positiveNumber(body.bedrooms);
    const bathrooms = positiveNumber(body.bathrooms);
    const parking = positiveNumber(body.parking);
    const legalDocs = Boolean(body.legalDocs);
    const occupied = Boolean(body.occupied);
    const summary = [
      `${operation} de ${propertyType.toLowerCase()} en ${location}.`,
      municipality ? `Municipio: ${municipality}.` : "",
      department ? `Departamento: ${department}.` : "",
      expectedPrice ? `Precio esperado: ${expectedPrice}.` : "",
      `Urgencia: ${urgency}.`,
      legalDocs ? "Indica que tiene documentación disponible." : "Documentación por confirmar.",
      occupied ? "La propiedad está ocupada." : "Ocupación por confirmar.",
      message,
    ].filter(Boolean).join(" ");

    const person = await create(TABLES.people, {
      [F.people.name]: name,
      ...(phone ? { [F.people.phone]: phone } : {}),
      ...(email ? { [F.people.email]: email } : {}),
      [F.people.relation]: relation,
      [F.people.status]: "Prospecto",
      [F.people.source]: "Web",
      [F.people.first]: today,
      [F.people.priority]: priority,
      [F.people.contactType]: "Propietario",
      [F.people.notes]: summary,
    });

    const missing = [
      !expectedPrice ? "precio" : "",
      !area ? "área" : "",
      !bedrooms && propertyType !== "Terreno" ? "habitaciones" : "",
      !bathrooms && propertyType !== "Terreno" ? "baños" : "",
      !legalDocs ? "documentación" : "",
      "fotografías",
      "dirección exacta",
    ].filter(Boolean).join(", ");

    const property = await create(TABLES.properties, {
      [F.properties.code]: reference,
      [F.properties.title]: `${propertyType} en ${location}`,
      [F.properties.notes]: summary,
      [F.properties.type]: propertyType,
      [F.properties.operation]: operation,
      ...(expectedPrice ? { [F.properties.price]: expectedPrice } : {}),
      ...(area ? { [F.properties.area]: area } : {}),
      ...(bedrooms ? { [F.properties.bedrooms]: bedrooms } : {}),
      ...(bathrooms ? { [F.properties.bathrooms]: bathrooms } : {}),
      ...(parking ? { [F.properties.parking]: parking } : {}),
      [F.properties.zone]: location,
      ...(municipality ? { [F.properties.municipality]: municipality } : {}),
      ...(department ? { [F.properties.department]: department } : {}),
      [F.properties.status]: "Disponible",
      [F.properties.owner]: [person.id],
      [F.properties.missing]: missing,
      [F.properties.commercialStatus]: "Captación",
      [F.properties.legalStatus]: legalDocs ? "En revisión" : "Sin revisar",
      [F.properties.priority]: priority,
      [F.properties.source]: "Web",
      [F.properties.enteredAt]: today,
      [F.properties.commercialNotes]: `Captación web. No publicar hasta validar identidad, autorización, precio y documentación. Urgencia declarada: ${urgency}.`,
    });

    const lead = await create(TABLES.leads, {
      [F.leads.name]: `${name} · Propietario · ${reference}`,
      [F.leads.notes]: summary,
      [F.leads.status]: "Todo",
      [F.leads.person]: [person.id],
      ...(phone ? { [F.leads.phone]: phone } : {}),
      [F.leads.classification]: "Nuevo",
      [F.leads.channel]: "Formulario web",
      [F.leads.date]: today,
      [F.leads.property]: [property.id],
      [F.leads.priority]: leadPriority,
      [F.leads.response]: "Pendiente",
      [F.leads.stage]: "Nuevo lead",
    });

    await create(TABLES.followUps, {
      [F.followUps.name]: `Evaluar captación ${reference} · ${name}`,
      [F.followUps.notes]: `Lead ${lead.id}. ${phone ? `Tel: ${phone}. ` : ""}${email ? `Correo: ${email}. ` : ""}${summary}`,
      [F.followUps.status]: "Todo",
      [F.followUps.person]: [person.id],
      [F.followUps.property]: [property.id],
      [F.followUps.next]: "Contactar al propietario, confirmar titularidad, precio, documentación, comisión, disponibilidad y autorización para publicar.",
      [F.followUps.due]: urgency === "Esta semana" ? today : addDays(1),
    });

    return NextResponse.json({ ok: true, reference, message: "Recibimos la propiedad y creamos el seguimiento comercial. Un asesor validará los datos antes de publicarla." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("No se pudo registrar la captación", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible registrar la propiedad." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
