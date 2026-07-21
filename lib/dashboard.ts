const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  properties: "tblZifOElWQtGaXHM",
  leads: "tblUxwYmD7Gliahzs",
  demands: "tblI0HtmgfOIKzzvs",
  followUps: "tbl5G7PfXax3WafYE",
  tasks: "tblP1NK4FnlO5pHTr",
  matches: "tbl3wXENYvxuUAR7R",
};

const FIELDS = {
  properties: {
    title: "fldcDIOahahyHurDm",
    code: "fldBHH1Ki3jmVIGwB",
    commercialStatus: "fldAN7GBFy247BShJ",
    preparation: "fldMEZNUrfGqkbd0v",
    missing: "fldcTVWJJ2USr5Lmq",
    updatedAt: "fld9wzxnvWYNinWkY",
  },
  leads: {
    name: "fldA9qI2kUKyv64JY",
    classification: "fldgS0dl95nJxdrE0",
    priority: "fldshPdum09OCTKW3",
    response: "fld6kfblYoaareLKg",
    enteredAt: "fldgb694pdT82sI8D",
  },
  demands: {
    name: "fld8IM8S3g9oBCONp",
    state: "fldIDXeMa3BPcRKRy",
  },
  followUps: {
    name: "fldXsuexoOflUM3e8",
    status: "fldmE4yR7BznYlT36",
    nextAction: "fldNrTzmiZlZokwkv",
    dueAt: "fldCStsSMMq6MPsVv",
  },
  tasks: {
    name: "fldZXN2c7B9pHKQbz",
    status: "fldF1T4stbMxv5sbm",
    priority: "fldd3t4Kn7NasxlNx",
    dueAt: "fldpuv4cHJ5XfivND",
  },
  matches: {
    name: "fldcN3S7JuCEMfMBU",
    score: "fld6wMqUlJQKd2zUj",
    level: "fldOa3LyT35TzuX0P",
    state: "fldkVRk98alu41J1X",
    calculatedAt: "fld9UcWdRNz4SE52i",
  },
};

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

export type DashboardItem = {
  id: string;
  title: string;
  detail: string;
  tone: "urgent" | "warning" | "good" | "neutral";
};

export type DashboardData = {
  connected: boolean;
  metrics: Array<{ label: string; value: number; detail: string }>;
  priorities: DashboardItem[];
  recent: DashboardItem[];
  insights: DashboardItem[];
};

function value(fields: Record<string, unknown>, fieldId: string) {
  return fields[fieldId];
}

function text(fields: Record<string, unknown>, fieldId: string) {
  const current = value(fields, fieldId);
  return typeof current === "string" ? current : "";
}

function number(fields: Record<string, unknown>, fieldId: string) {
  const current = value(fields, fieldId);
  return typeof current === "number" ? current : 0;
}

function isOpen(status: string) {
  const normalized = status.toLowerCase();
  return !["done", "cerrada", "cerrado", "completada", "completado", "descartada", "descartado"].includes(normalized);
}

async function listAll(tableId: string): Promise<AirtableRecord[]> {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN");
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
    const page = (await response.json()) as AirtableResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [properties, leads, demands, followUps, tasks, matches] = await Promise.all([
      listAll(TABLES.properties),
      listAll(TABLES.leads),
      listAll(TABLES.demands),
      listAll(TABLES.followUps),
      listAll(TABLES.tasks),
      listAll(TABLES.matches),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const activeProperties = properties.filter((record) => {
      const status = text(record.fields, FIELDS.properties.commercialStatus);
      return status && !["Archivada", "Cerrada"].includes(status);
    });
    const newLeads = leads.filter((record) => text(record.fields, FIELDS.leads.classification) === "Nuevo");
    const activeDemands = demands.filter((record) => ["Activa", "En búsqueda"].includes(text(record.fields, FIELDS.demands.state)));
    const pendingFollowUps = followUps.filter((record) => isOpen(text(record.fields, FIELDS.followUps.status)));
    const suggestedMatches = matches.filter((record) => ["Sugerida", "Revisar"].includes(text(record.fields, FIELDS.matches.state)));

    const overdueTasks = tasks.filter((record) => {
      const dueAt = text(record.fields, FIELDS.tasks.dueAt);
      return dueAt && dueAt < today && isOpen(text(record.fields, FIELDS.tasks.status));
    });
    const unansweredLeads = leads.filter((record) => {
      const response = text(record.fields, FIELDS.leads.response);
      return response === "Pendiente" || response === "Sin responder";
    });
    const incompleteProperties = activeProperties.filter((record) => Boolean(text(record.fields, FIELDS.properties.missing)));

    const priorities: DashboardItem[] = [
      ...unansweredLeads.slice(0, 4).map((record) => ({
        id: record.id,
        title: text(record.fields, FIELDS.leads.name) || "Lead sin nombre",
        detail: `Lead ${text(record.fields, FIELDS.leads.priority) || "sin prioridad"} pendiente de respuesta`,
        tone: "urgent" as const,
      })),
      ...overdueTasks.slice(0, 4).map((record) => ({
        id: record.id,
        title: text(record.fields, FIELDS.tasks.name) || "Tarea vencida",
        detail: `Venció ${text(record.fields, FIELDS.tasks.dueAt)} · ${text(record.fields, FIELDS.tasks.priority) || "sin prioridad"}`,
        tone: "warning" as const,
      })),
      ...incompleteProperties.slice(0, 3).map((record) => ({
        id: record.id,
        title: text(record.fields, FIELDS.properties.title) || text(record.fields, FIELDS.properties.code),
        detail: text(record.fields, FIELDS.properties.missing),
        tone: "warning" as const,
      })),
    ].slice(0, 8);

    const recent: DashboardItem[] = [
      ...leads.map((record) => ({
        id: `lead-${record.id}`,
        title: text(record.fields, FIELDS.leads.name) || "Nuevo lead",
        detail: `Lead · ${text(record.fields, FIELDS.leads.enteredAt) || record.createdTime?.slice(0, 10) || "sin fecha"}`,
        tone: "neutral" as const,
        date: text(record.fields, FIELDS.leads.enteredAt) || record.createdTime || "",
      })),
      ...matches.map((record) => ({
        id: `match-${record.id}`,
        title: text(record.fields, FIELDS.matches.name) || "Nueva coincidencia",
        detail: `${text(record.fields, FIELDS.matches.level) || "Coincidencia"} · ${number(record.fields, FIELDS.matches.score)} puntos`,
        tone: number(record.fields, FIELDS.matches.score) >= 85 ? "good" as const : "neutral" as const,
        date: text(record.fields, FIELDS.matches.calculatedAt) || record.createdTime || "",
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .map(({ date: _date, ...item }) => item);

    const strongMatches = matches.filter((record) => number(record.fields, FIELDS.matches.score) >= 85).length;
    const insights: DashboardItem[] = [
      {
        id: "follow-ups",
        title: `${pendingFollowUps.length} seguimientos requieren atención`,
        detail: pendingFollowUps.length ? "Conviene resolverlos antes de iniciar nuevas tareas comerciales." : "No hay seguimientos pendientes.",
        tone: pendingFollowUps.length ? "warning" : "good",
      },
      {
        id: "strong-matches",
        title: `${strongMatches} coincidencias fuertes disponibles`,
        detail: "Prioriza las de 85 puntos o más para contacto comercial.",
        tone: strongMatches ? "good" : "neutral",
      },
      {
        id: "incomplete-properties",
        title: `${incompleteProperties.length} propiedades necesitan información`,
        detail: "Completar precio, ubicación y documentación mejora el recomendador.",
        tone: incompleteProperties.length ? "warning" : "good",
      },
    ];

    return {
      connected: true,
      metrics: [
        { label: "Propiedades activas", value: activeProperties.length, detail: `${incompleteProperties.length} con datos pendientes` },
        { label: "Leads nuevos", value: newLeads.length, detail: `${unansweredLeads.length} sin respuesta` },
        { label: "Demandas activas", value: activeDemands.length, detail: "En búsqueda comercial" },
        { label: "Seguimientos", value: pendingFollowUps.length, detail: "Pendientes de completar" },
        { label: "Coincidencias", value: suggestedMatches.length, detail: `${strongMatches} fuertes` },
      ],
      priorities,
      recent,
      insights,
    };
  } catch (error) {
    console.error("No se pudo cargar el dashboard", error);
    return {
      connected: false,
      metrics: [
        { label: "Propiedades activas", value: 0, detail: "Sin conexión" },
        { label: "Leads nuevos", value: 0, detail: "Sin conexión" },
        { label: "Demandas activas", value: 0, detail: "Sin conexión" },
        { label: "Seguimientos", value: 0, detail: "Sin conexión" },
        { label: "Coincidencias", value: 0, detail: "Sin conexión" },
      ],
      priorities: [],
      recent: [],
      insights: [{ id: "connection", title: "Airtable no está conectado", detail: "Revisa AIRTABLE_API_TOKEN y AIRTABLE_BASE_ID en Vercel.", tone: "urgent" }],
    };
  }
}
