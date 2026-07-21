const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  followUps: "tbl5G7PfXax3WafYE",
  publications: "tblEmH9qmv71N6YNC",
  visits: "tblOsY6wXA3L6PZtV",
  offers: "tblrsZAPjijpSLHpC",
  tasks: "tblP1NK4FnlO5pHTr",
};

const FIELDS = {
  followUps: { name: "fldXsuexoOflUM3e8", status: "fldmE4yR7BznYlT36", nextAction: "fldNrTzmiZlZokwkv", dueAt: "fldCStsSMMq6MPsVv" },
  publications: { name: "fldTy8MIdTsjsQKvK", status: "fld4VPWXT1Hn6p5jA", date: "fldKMGodj9Z0Q3Pu8" },
  visits: { name: "fldDiLoHJDLE2iy4B", status: "fldfiVykzucG4N0C8", date: "fldwAKwmRAiRnW6zL" },
  offers: { name: "fldp7VZMnrqwPkSPR", status: "fldLRwtXEWkOVsEvY" },
  tasks: { status: "fldF1T4stbMxv5sbm" },
};

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };
type PipelineFields = { name: string; status: string; date?: string };

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
        const name = text(record.fields[FIELDS.followUps.name]);
        const nextAction = text(record.fields[FIELDS.followUps.nextAction]);
        const dueAt = text(record.fields[FIELDS.followUps.dueAt]);
        const status = normalizeStatus(text(record.fields[FIELDS.followUps.status]));
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

async function pipeline(table: string, fields: PipelineFields, label: string) {
  try {
    const records = await listAll(table, true);
    const items = records
      .map((record) => ({
        id: record.id,
        name: text(record.fields[fields.name]) || `${label} ${record.id.slice(-5)}`,
        status: normalizeStatus(text(record.fields[fields.status]) || "En proceso"),
        createdAt: fields.date ? text(record.fields[fields.date]) : record.createdTime?.slice(0, 10) || "",
      }))
      .filter((item) => !isClosed(item.status))
      .sort((a, b) => (a.createdAt || "9999-12-31").localeCompare(b.createdAt || "9999-12-31"))
      .slice(0, 20);
    return { connected: true, total: records.length, items };
  } catch {
    return { connected: false, total: 0, items: [] as Array<{ id: string; name: string; status: string; createdAt: string }> };
  }
}

export const getPublicationData = () => pipeline(TABLES.publications, FIELDS.publications, "Publicación");
export const getVisitData = () => pipeline(TABLES.visits, FIELDS.visits, "Visita");
export const getOfferData = () => pipeline(TABLES.offers, FIELDS.offers, "Oferta");

export async function getDirectorData() {
  const [followUps, publications, visits, offers, tasks] = await Promise.all([
    getFollowUpData(), getPublicationData(), getVisitData(), getOfferData(), listAll(TABLES.tasks, true).catch(() => []),
  ]);
  const openTasks = tasks.filter((record) => !isClosed(text(record.fields[FIELDS.tasks.status])));
  const decisions = [
    { title: `${followUps.overdue} seguimientos vencidos`, detail: followUps.overdue ? "Resolver primero para evitar oportunidades frías." : "La cola de seguimiento está controlada.", tone: followUps.overdue ? "urgent" : "good", href: "/seguimiento" },
    { title: `${publications.items.length} publicaciones en proceso`, detail: "Completar y distribuir las piezas pendientes.", tone: publications.items.length ? "warning" : "good", href: "/publicaciones" },
    { title: `${visits.items.length} visitas abiertas`, detail: "Confirmar horarios, asistentes y resultado posterior.", tone: visits.items.length ? "neutral" : "good", href: "/visitas" },
    { title: `${offers.items.length} ofertas activas`, detail: "Priorizar negociación y fecha límite de respuesta.", tone: offers.items.length ? "warning" : "good", href: "/ofertas" },
  ];
  return { connected: followUps.connected && publications.connected && visits.connected && offers.connected, openTasks: openTasks.length, decisions };
}
