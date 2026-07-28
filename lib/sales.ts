const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TIME_ZONE = process.env.FUTURA_TIME_ZONE ?? "America/Guatemala";

const TABLES = {
  properties: "tblZifOElWQtGaXHM",
  leads: "tblUxwYmD7Gliahzs",
  publications: "tblEmH9qmv71N6YNC",
  tasks: "tblP1NK4FnlO5pHTr",
};

const F = {
  properties: {
    code: "fldBHH1Ki3jmVIGwB", title: "fldcDIOahahyHurDm", operation: "fldm7rV2anSTjGpgp",
    price: "fldvcBlG4w3yfUYIy", zone: "fldcvNHcJkzuYhs6a", commercialStatus: "fldAN7GBFy247BShJ",
    preparation: "fldMEZNUrfGqkbd0v", missing: "fldcTVWJJ2USr5Lmq", publishedAt: "flde0etPNA2Vabkz1",
    priority: "fldwKZGKdEybym5z9",
  },
  leads: {
    name: "fldA9qI2kUKyv64JY", response: "fld6kfblYoaareLKg", priority: "fldshPdum09OCTKW3",
    channel: "flduBfRO0rLLZq1WD", enteredAt: "fldgb694pdT82sI8D", phone: "fldBAVL33laSAVf1q",
  },
  publications: {
    name: "fldTy8MIdTsjsQKvK", status: "fld4VPWXT1Hn6p5jA", property: "fldvHtWJ1Mq153e1t",
    channel: "fldyyNpqVPFLQ66MI", date: "fldKMGodj9Z0Q3Pu8", queries: "fldQEozb6jO2RZKHB",
  },
  tasks: {
    name: "fldZXN2c7B9pHKQbz", notes: "fldjK0f8YCBnaThur", status: "fldF1T4stbMxv5sbm",
    priority: "fldd3t4Kn7NasxlNx", due: "fldpuv4cHJ5XfivND", automatable: "fldPa0mFZe9dBh9MM",
  },
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

export type SalesAgent = {
  id: string;
  name: string;
  mission: string;
  channels: string[];
  workload: number;
  status: "Activo" | "Listo" | "En espera";
  boundary: string;
};

export type SalesAction = {
  id: string;
  agent: string;
  title: string;
  detail: string;
  channel: string;
  priority: "Alta" | "Media" | "Baja";
};

export type SalesCockpit = {
  connected: boolean;
  stats: { label: string; value: number; detail: string }[];
  agents: SalesAgent[];
  actions: SalesAction[];
  properties: { id: string; code: string; title: string; detail: string; readiness: string }[];
  pendingLeads: { id: string; name: string; detail: string; priority: string }[];
  message?: string;
};

function text(fields: Record<string, unknown>, id: string) {
  const value = fields[id];
  return typeof value === "string" ? value : "";
}

function number(fields: Record<string, unknown>, id: string) {
  const value = fields[id];
  return typeof value === "number" ? value : 0;
}

function links(fields: Record<string, unknown>, id: string) {
  const value = fields[id];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function daysSince(date: string) {
  if (!date) return Number.POSITIVE_INFINITY;
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime();
  return Number.isFinite(parsed) ? Math.floor((Date.now() - parsed) / 86_400_000) : Number.POSITIVE_INFINITY;
}

async function listAll(tableId: string): Promise<AirtableRecord[]> {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN");
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
    const page = await response.json() as AirtableResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

function propertyDetail(record: AirtableRecord) {
  const fields = record.fields;
  const parts = [
    text(fields, F.properties.operation),
    text(fields, F.properties.zone),
    number(fields, F.properties.price) ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(number(fields, F.properties.price)) : "Precio por confirmar",
  ];
  return parts.filter(Boolean).join(" · ");
}

function isActiveProperty(record: AirtableRecord) {
  const status = text(record.fields, F.properties.commercialStatus);
  return !["Vendida", "Alquilada", "Archivada", "Promesa de compraventa"].includes(status);
}

function priorityRank(value: string) {
  return value === "Urgente" ? 4 : value === "Alta" ? 3 : value === "Media" ? 2 : 1;
}

export async function getSalesCockpit(): Promise<SalesCockpit> {
  try {
    const [properties, leads, publications] = await Promise.all([
      listAll(TABLES.properties),
      listAll(TABLES.leads),
      listAll(TABLES.publications),
    ]);

    const activeProperties = properties.filter(isActiveProperty);
    const publishedPropertyIds = new Set(publications.flatMap((record) => links(record.fields, F.publications.property)));
    const readyProperties = activeProperties
      .filter((record) => {
        const status = text(record.fields, F.properties.commercialStatus);
        const missing = text(record.fields, F.properties.missing);
        return ["Lista para publicar", "Publicada", "Con interesados"].includes(status) || (!missing && status !== "Captación");
      })
      .sort((a, b) => {
        const aScore = text(a.fields, F.properties.priority) === "Alta" ? 2 : 1;
        const bScore = text(b.fields, F.properties.priority) === "Alta" ? 2 : 1;
        return bScore - aScore;
      });

    const republish = readyProperties.filter((record) => {
      const last = text(record.fields, F.properties.publishedAt);
      return publishedPropertyIds.has(record.id) ? daysSince(last) >= 10 : true;
    });

    const pendingLeads = leads
      .filter((record) => ["Pendiente", "Calificando"].includes(text(record.fields, F.leads.response)))
      .sort((a, b) => priorityRank(text(b.fields, F.leads.priority)) - priorityRank(text(a.fields, F.leads.priority)));

    const actions: SalesAction[] = [];
    republish.slice(0, 3).forEach((record, index) => {
      const title = text(record.fields, F.properties.title) || text(record.fields, F.properties.code) || "Propiedad";
      actions.push({
        id: `publish-${record.id}`,
        agent: "Publicador multicanal",
        title: `${index === 0 ? "Publicar" : "Relanzar"} ${title}`,
        detail: `${propertyDetail(record)}. Preparar portada, texto y llamada a WhatsApp; publicar sólo tras aprobación humana.`,
        channel: index === 0 ? "Marketplace + Facebook" : "Instagram + WhatsApp",
        priority: index === 0 ? "Alta" : "Media",
      });
    });

    pendingLeads.slice(0, 4).forEach((record) => {
      actions.push({
        id: `lead-${record.id}`,
        agent: "Prospector y seguimiento",
        title: `Contactar ${text(record.fields, F.leads.name) || "lead pendiente"}`,
        detail: `${text(record.fields, F.leads.priority) || "Sin prioridad"} · ${text(record.fields, F.leads.channel) || "Canal sin registrar"}. Validar necesidad y definir próxima acción.`,
        channel: text(record.fields, F.leads.phone) ? "WhatsApp o llamada" : "Canal registrado",
        priority: priorityRank(text(record.fields, F.leads.priority)) >= 3 ? "Alta" : "Media",
      });
    });

    actions.push({
      id: "owner-outreach",
      agent: "Captador de propietarios",
      title: "Distribuir el enlace de captación",
      detail: "Compartir /vende con referidos, contactos conocidos y grupos locales donde las reglas permitan servicios inmobiliarios. No enviar mensajes masivos no solicitados.",
      channel: "WhatsApp + grupos autorizados + referidos",
      priority: "Alta",
    });

    actions.push({
      id: "measurement",
      agent: "Analista comercial",
      title: "Medir publicaciones y conversaciones",
      detail: "Registrar canal, URL, consultas recibidas y siguiente acción para saber qué genera clientes sin pagar publicidad.",
      channel: "CRM + Publicaciones",
      priority: "Media",
    });

    const agents: SalesAgent[] = [
      { id: "owner", name: "Captador de propietarios", mission: "Conseguir inventario nuevo mediante referidos, contenido y comunidades locales.", channels: ["Web", "WhatsApp", "Grupos", "Referidos"], workload: 1, status: "Activo", boundary: "No scrapea datos privados ni envía spam." },
      { id: "publisher", name: "Publicador multicanal", mission: "Preparar y distribuir propiedades aprobadas con un ángulo diferente por canal.", channels: ["Marketplace", "Facebook", "Instagram", "WhatsApp"], workload: republish.slice(0, 3).length, status: republish.length ? "Activo" : "En espera", boundary: "Marketplace y grupos se ejecutan manualmente cuando la plataforma no ofrece una API permitida." },
      { id: "prospector", name: "Prospector de compradores", mission: "Encontrar demanda pública y convertir consultas en conversaciones calificadas.", channels: ["CRM", "Correo", "WhatsApp", "Redes"], workload: pendingLeads.length, status: pendingLeads.length ? "Activo" : "Listo", boundary: "Sólo usa fuentes públicas y contactos con base legítima o consentimiento." },
      { id: "followup", name: "Agente de seguimiento", mission: "Evitar que un lead se pierda y asegurar que todos tengan próxima acción.", channels: ["WhatsApp", "Llamada", "Correo"], workload: pendingLeads.length, status: pendingLeads.length ? "Activo" : "Listo", boundary: "La negociación, visitas y mensajes sensibles requieren revisión humana." },
      { id: "analyst", name: "Analista comercial", mission: "Medir consultas, visitas y cierres para priorizar lo que sí vende.", channels: ["Airtable", "Growth AI"], workload: publications.length, status: "Listo", boundary: "No inventa atribución; sólo usa resultados registrados." },
    ];

    return {
      connected: true,
      stats: [
        { label: "Propiedades activas", value: activeProperties.length, detail: `${readyProperties.length} listas para promoción` },
        { label: "Para publicar", value: republish.length, detail: "Nuevas o listas para relanzar" },
        { label: "Leads por atender", value: pendingLeads.length, detail: "Pendientes o en calificación" },
        { label: "Publicaciones", value: publications.length, detail: `${publications.reduce((sum, record) => sum + number(record.fields, F.publications.queries), 0)} consultas registradas` },
      ],
      agents,
      actions: actions.slice(0, 10),
      properties: republish.slice(0, 6).map((record) => ({
        id: record.id,
        code: text(record.fields, F.properties.code),
        title: text(record.fields, F.properties.title) || "Propiedad sin título",
        detail: propertyDetail(record),
        readiness: text(record.fields, F.properties.preparation) || text(record.fields, F.properties.commercialStatus) || "Por revisar",
      })),
      pendingLeads: pendingLeads.slice(0, 6).map((record) => ({
        id: record.id,
        name: text(record.fields, F.leads.name) || "Lead sin nombre",
        detail: `${text(record.fields, F.leads.channel) || "Sin canal"} · ${text(record.fields, F.leads.enteredAt) || record.createdTime?.slice(0, 10) || "Sin fecha"}`,
        priority: text(record.fields, F.leads.priority) || "Media",
      })),
    };
  } catch (error) {
    console.error("No se pudo cargar el equipo de ventas", error);
    return {
      connected: false,
      stats: [
        { label: "Propiedades activas", value: 0, detail: "Sin conexión" },
        { label: "Para publicar", value: 0, detail: "Sin conexión" },
        { label: "Leads por atender", value: 0, detail: "Sin conexión" },
        { label: "Publicaciones", value: 0, detail: "Sin conexión" },
      ],
      agents: [], actions: [], properties: [], pendingLeads: [],
      message: error instanceof Error ? error.message : "No se pudo conectar con Airtable.",
    };
  }
}

async function createTask(fields: Record<string, unknown>) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLES.tasks}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ typecast: true, records: [{ fields }] }),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Airtable rechazó la tarea.");
  return payload.records?.[0] as AirtableRecord;
}

export async function createDailySalesPlan() {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN");
  const cockpit = await getSalesCockpit();
  if (!cockpit.connected) throw new Error(cockpit.message || "No se pudo cargar el equipo de ventas.");
  const existing = await listAll(TABLES.tasks);
  const date = today();
  const prefix = `[Ventas ${date}]`;
  const existingNames = new Set(existing.map((record) => text(record.fields, F.tasks.name)));
  const created: AirtableRecord[] = [];

  for (const action of cockpit.actions.slice(0, 8)) {
    const name = `${prefix} ${action.agent}: ${action.title}`.slice(0, 240);
    if (existingNames.has(name)) continue;
    const task = await createTask({
      [F.tasks.name]: name,
      [F.tasks.notes]: `${action.detail}\nCanal: ${action.channel}.\nRegla: no publicar, contactar ni enviar campañas masivas sin autorización, consentimiento o revisión humana cuando corresponda.`,
      [F.tasks.status]: "Todo",
      [F.tasks.priority]: action.priority,
      [F.tasks.due]: date,
      [F.tasks.automatable]: action.agent === "Analista comercial",
    });
    created.push(task);
    existingNames.add(name);
  }

  return { created: created.length, total: cockpit.actions.slice(0, 8).length, date };
}
