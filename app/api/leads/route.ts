import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  personas: "tblmDGwNAVcYnUAnW",
  leads: "tblUxwYmD7Gliahzs",
  demandas: "tblI0HtmgfOIKzzvs",
  seguimientos: "tbl5G7PfXax3WafYE",
};

const FIELDS = {
  personas: {
    name: "fldJkHjV0rXKkEqIH",
    phone: "fldWBr2kdR2vp6VAH",
    email: "fld7TYCurdbXo74x8",
    relation: "flddcozryg3AGcfPR",
    status: "fldDF3XWHUNg3IxiB",
    notes: "fldApr2IshWNFVNpZ",
    source: "fld3LdFD1yfVQ37iy",
    firstContact: "fldWp1iBQbMrHsCWu",
    priority: "fld8xTtELef1jE5sX",
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
  demandas: {
    name: "fld8IM8S3g9oBCONp",
    notes: "fldzlIOCbFb7W87cD",
    status: "fldy3KMTLZ8NjK2Vh",
    operation: "fldG7zFdEQMSgMK4i",
    budget: "fldwLBaTLOJub2Umq",
    person: "fldxCgfg8p9AXUBhN",
    propertyType: "fldyr37i8tbXghWk9",
    location: "fldUGmROgYr3CByJC",
    financing: "fldBJxC9NLH75Eu89",
    urgency: "fldMAJc64LIJm4Nx9",
    created: "fldXIivtPWm5BCcJ1",
    originLead: "fldB4RtgZ1O0FMiLx",
    commercialStatus: "fldIDXeMa3BPcRKRy",
    requirements: "fldsQanK88Z9dGtIC",
  },
  followups: {
    name: "fldXsuexoOflUM3e8",
    notes: "fldPkefB3ayIzmtx7",
    status: "fldmE4yR7BznYlT36",
    person: "fldozfWMEWoR7o4xO",
    nextAction: "fldNrTzmiZlZokwkv",
    dueAt: "fldCStsSMMq6MPsVv",
  },
};

const dateInManila = (days = 0) => {
  const date = new Date(Date.now() + days * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
};

async function createRecord(table: string, fields: Record<string, unknown>) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ typecast: true, records: [{ fields }] }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || "Airtable rechazó el registro.");
  return result.records?.[0] as { id: string };
}

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: NextRequest) {
  if (!API_TOKEN) return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });

  try {
    const body = await request.json() as Record<string, unknown>;
    if (clean(body.website)) return NextResponse.json({ ok: true });

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 120);
    const operation = clean(body.operation, 30) || "Compra";
    const propertyType = clean(body.propertyType, 60);
    const location = clean(body.location, 200);
    const message = clean(body.message, 1200);
    const budget = Number(body.budget) || undefined;
    const financing = Boolean(body.financing);

    if (!name || (!phone && !email)) {
      return NextResponse.json({ error: "Indica tu nombre y al menos un teléfono o correo." }, { status: 400 });
    }

    const today = dateInManila();
    const person = await createRecord(TABLES.personas, {
      [FIELDS.personas.name]: name,
      ...(phone ? { [FIELDS.personas.phone]: phone } : {}),
      ...(email ? { [FIELDS.personas.email]: email } : {}),
      [FIELDS.personas.relation]: ["Cliente potencial"],
      [FIELDS.personas.status]: "Nuevo",
      [FIELDS.personas.source]: "Formulario web",
      [FIELDS.personas.firstContact]: today,
      [FIELDS.personas.priority]: "Alta",
      [FIELDS.personas.notes]: message || `Interesado en ${operation.toLowerCase()}${location ? ` en ${location}` : ""}.`,
    });

    const lead = await createRecord(TABLES.leads, {
      [FIELDS.leads.name]: `${name} · ${operation}${location ? ` · ${location}` : ""}`,
      [FIELDS.leads.notes]: message || "Consulta recibida desde el formulario de captación.",
      [FIELDS.leads.status]: "Nuevo",
      [FIELDS.leads.person]: [person.id],
      ...(phone ? { [FIELDS.leads.phone]: phone } : {}),
      [FIELDS.leads.classification]: "Nuevo ingreso",
      [FIELDS.leads.channel]: "Formulario web",
      [FIELDS.leads.date]: today,
      [FIELDS.leads.priority]: "Alta",
      [FIELDS.leads.response]: "Pendiente",
    });

    await createRecord(TABLES.demandas, {
      [FIELDS.demandas.name]: `${operation} · ${propertyType || "Propiedad"} · ${name}`,
      [FIELDS.demandas.notes]: message || "Demanda creada automáticamente desde captación web.",
      [FIELDS.demandas.status]: "Activa",
      [FIELDS.demandas.operation]: operation,
      ...(budget ? { [FIELDS.demandas.budget]: budget } : {}),
      [FIELDS.demandas.person]: [person.id],
      ...(propertyType ? { [FIELDS.demandas.propertyType]: propertyType } : {}),
      ...(location ? { [FIELDS.demandas.location]: location } : {}),
      [FIELDS.demandas.financing]: financing,
      [FIELDS.demandas.urgency]: "Alta",
      [FIELDS.demandas.created]: today,
      [FIELDS.demandas.originLead]: [lead.id],
      [FIELDS.demandas.commercialStatus]: "Nueva",
      ...(message ? { [FIELDS.demandas.requirements]: message } : {}),
    });

    await createRecord(TABLES.seguimientos, {
      [FIELDS.followups.name]: `Contactar a ${name}`,
      [FIELDS.followups.notes]: `Lead captado por formulario. ${phone ? `Tel: ${phone}. ` : ""}${email ? `Correo: ${email}.` : ""}`,
      [FIELDS.followups.status]: "Pendiente",
      [FIELDS.followups.person]: [person.id],
      [FIELDS.followups.nextAction]: "Contactar al cliente y validar necesidad, presupuesto y plazo.",
      [FIELDS.followups.dueAt]: today,
    });

    return NextResponse.json({ ok: true, message: "Tu solicitud fue recibida. Te contactaremos pronto." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible registrar la solicitud." }, { status: 500 });
  }
}
