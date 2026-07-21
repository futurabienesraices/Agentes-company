const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  followUps: "tbl5G7PfXax3WafYE",
  publications: "Publicaciones",
  visits: "Visitas",
  offers: "Ofertas",
  tasks: "tblP1NK4FnlO5pHTr",
};

const FOLLOW_UP_FIELDS = {
  name: "fldXsuexoOflUM3e8",
  status: "fldmE4yR7BznYlT36",
  nextAction: "fldNrTzmiZlZokwkv",
  dueAt: "fldCStsSMMq6MPsVv",
};

const TASK_FIELDS = {
  status: "fldF1T4stbMxv5sbm",
};

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

async function airtable<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN");
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
  return response.json() as Promise<T>;
}

async function listAll(table: string, byFieldId = false) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (byFieldId) params.set("returnFieldsByFieldId", "true");
    if (offset) params.set("offset", offset);
    const page = await airtable<AirtableResponse>(`${encodeURIComponent(table)}?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const firstText = (fields: Record<string, unknown>) => Object.values(fields).map(text).find(Boolean) || "";
const todayInManila = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const normalizeStatus = (status: string) => {
  const value = status.trim();
  if (!value || ["todo", "todos", "all"].includes(value.toLowerCase())) return "Pendiente";
  return value;
};
const isClosed = (status: string) => ["cerrado", "cerrada", "completado", "completada", "publicada", "realizada", "aceptada", "rechazada", "cancelada", "cancelado"].includes(normalizeStatus(status).toLowerCase());

export async function getFollowUpData() {
  try {
    const today = todayInManila();
    const records = await listAll(TABLES.followUps, true);
    const queue = records
      .map((record) => {
        const name = text(record.fields[FOLLOW_UP_FIELDS.name]);
        const nextAction = text(record.fields[FOLLOW_UP_FIELDS.nextAction]);
        const dueAt = text(record.fields[FOLLOW_UP_FIELDS.dueAt]);
        const status = normalizeStatus(text(record.fields[FOLLOW_UP_FIELDS.status]));
        if (!name && !nextAction && !dueAt) return null;
        const overdue = Boolean(dueAt && dueAt < today && !isClosed(status));
        const dueToday = dueAt === today && !isClosed(status);
        return {
          id: record.id,
          name: name || "Seguimiento pendiente de identificar",
          status,
          nextAction: nextAction || "Contactar al cliente",
          dueAt,
          priority: overdue ? 3 : dueToday ? 2 : dueAt ? 1 : 0,
          tone: overdue ? "urgent" : dueToday ? "warning" : "neutral",
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item) && !isClosed(item.status))
      .sort((a, b) => b.priority - a.priority || (a.dueAt || "9999-12-31").localeCompare(b.dueAt || "9999-12-31"));
    return { connected: true, queue, overdue: queue.filter((item) => item.tone === "urgent").length };
  } catch {
    return { connected: false, queue: [] as Array<{ id: string; name: string; status: string; nextAction: string; dueAt: string; priority: number; tone: string }>, overdue: 0 };
  }
}

async function genericPipeline(table: string, label: string) {
  try {
    const records = await listAll(table);
    const items = records.map((record) => {
      const values = Object.values(record.fields);
      const rawStatus = values.find((value) => typeof value === "string" && /pendiente|borrador|programad|confirmad|negoci|enviad|publicad|realizad|aceptad|rechazad|cancelad/i.test(value)) as string | undefined;
      const status = normalizeStatus(rawStatus || "En proceso");
      return {
        id: record.id,
        name: firstText(record.fields) || `${label} ${record.id.slice(-5)}`,
        status,
        createdAt: record.createdTime?.slice(0, 10) || "",
      };
    }).filter((item) => !isClosed(item.status)).slice(0, 20);
    return { connected: true, total: records.length, items };
  } catch {
    return { connected: false, total: 0, items: [] as Array<{ id: string; name: string; status: string; createdAt: string }> };
  }
}

export const getPublicationData = () => genericPipeline(TABLES.publications, "Publicación");
export const getVisitData = () => genericPipeline(TABLES.visits, "Visita");
export const getOfferData = () => genericPipeline(TABLES.offers, "Oferta");

export async function getDirectorData() {
  const [followUps, publications, visits, offers, tasks] = await Promise.all([
    getFollowUpData(), getPublicationData(), getVisitData(), getOfferData(), listAll(TABLES.tasks, true).catch(() => []),
  ]);
  const openTasks = tasks.filter((record) => !isClosed(text(record.fields[TASK_FIELDS.status])));
  const decisions = [
    { title: `${followUps.overdue} seguimientos vencidos`, detail: followUps.overdue ? "Resolver primero para evitar oportunidades frías." : "La cola de seguimiento está controlada.", tone: followUps.overdue ? "urgent" : "good", href: "/seguimiento" },
    { title: `${publications.items.length} publicaciones en proceso`, detail: "Completar y distribuir las piezas pendientes.", tone: publications.items.length ? "warning" : "good", href: "/publicaciones" },
    { title: `${visits.items.length} visitas abiertas`, detail: "Confirmar horarios, asistentes y resultado posterior.", tone: visits.items.length ? "neutral" : "good", href: "/visitas" },
    { title: `${offers.items.length} ofertas activas`, detail: "Priorizar negociación y fecha límite de respuesta.", tone: offers.items.length ? "warning" : "good", href: "/ofertas" },
  ];
  return { connected: followUps.connected, openTasks: openTasks.length, decisions };
}
