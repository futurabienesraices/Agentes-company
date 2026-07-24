import { getDashboardData } from "./dashboard";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLE_ID = process.env.AIRTABLE_GROWTH_TABLE_ID ?? "tbl1xmcrEJWcZY0gL";

const FIELDS = {
  title: "fld60xttXDSSvisWk",
  status: "fldiHeUrwcJDR2NpI",
  category: "fld6QsHmVYZMz3sSE",
  score: "fldVAwQk88A0jnr1B",
  expectedRevenue: "fld3evC1Nv2mbEiXf",
  probability: "fldfhwMmYscMDLTwF",
  expectedCost: "fld2GgIZLvg7DydJE",
  effort: "fldLdSELzsA0rsKre",
  daysToRevenue: "fld3458qWAIBzbdb1",
  automation: "fldcowDIvPhNh5xmB",
  aiAction: "fldi13FwuQEOPGO01",
  humanAction: "fldNcfRJdRKgdhuWv",
  nextAction: "fldlDRcWJLnBGDN2V",
  owner: "fldIAwvl07NOLipik",
  targetMetric: "fldREa3X3KnFxQmb8",
  actualRevenue: "fldH9kSrtD6FnJ3gv",
  actualCost: "fldxgcbb5zUKGZ936",
  learning: "fldJs4lbMwVfwCLh4",
  detectedAt: "fldT2Yg3mw2HXtY6y",
  reviewAt: "fld0NX6g6OgUUKKcq",
  ethical: "fldQxvgkGoppFrn7Z",
  source: "fldExJStKb2c5GRoR",
  notes: "fldmabsvUW6GzXtvV",
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

export type GrowthStatus = "Detectada" | "Priorizada" | "En diseño" | "Lista para ejecutar" | "En curso" | "Midiendo" | "Mejorar" | "Cerrada" | "Descartada";
export type GrowthOwner = "IA" | "Usuario" | "Ambos";

export type GrowthOpportunity = {
  id: string;
  title: string;
  status: GrowthStatus;
  category: string;
  score: number;
  expectedRevenue?: number;
  probability?: number;
  expectedCost?: number;
  effort?: number;
  daysToRevenue?: number;
  automation: string;
  aiAction: string;
  humanAction: string;
  nextAction: string;
  owner: GrowthOwner;
  targetMetric: string;
  actualRevenue?: number;
  actualCost?: number;
  learning: string;
  detectedAt: string;
  reviewAt: string;
  ethical: boolean;
  source: string;
  notes: string;
};

export type GrowthInput = Partial<Omit<GrowthOpportunity, "id" | "score">> & {
  title: string;
  score?: number;
};

function requireToken() {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN.");
  return API_TOKEN;
}

async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Airtable respondió ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}

const asText = (value: unknown) => typeof value === "string" ? value : "";
const asNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
const asBoolean = (value: unknown) => value === true;

function fromRecord(record: AirtableRecord): GrowthOpportunity {
  const fields = record.fields;
  return {
    id: record.id,
    title: asText(fields[FIELDS.title]) || "Oportunidad sin nombre",
    status: (asText(fields[FIELDS.status]) || "Detectada") as GrowthStatus,
    category: asText(fields[FIELDS.category]) || "Otra",
    score: asNumber(fields[FIELDS.score]) ?? 0,
    expectedRevenue: asNumber(fields[FIELDS.expectedRevenue]),
    probability: asNumber(fields[FIELDS.probability]),
    expectedCost: asNumber(fields[FIELDS.expectedCost]),
    effort: asNumber(fields[FIELDS.effort]),
    daysToRevenue: asNumber(fields[FIELDS.daysToRevenue]),
    automation: asText(fields[FIELDS.automation]),
    aiAction: asText(fields[FIELDS.aiAction]),
    humanAction: asText(fields[FIELDS.humanAction]),
    nextAction: asText(fields[FIELDS.nextAction]),
    owner: (asText(fields[FIELDS.owner]) || "Ambos") as GrowthOwner,
    targetMetric: asText(fields[FIELDS.targetMetric]),
    actualRevenue: asNumber(fields[FIELDS.actualRevenue]),
    actualCost: asNumber(fields[FIELDS.actualCost]),
    learning: asText(fields[FIELDS.learning]),
    detectedAt: asText(fields[FIELDS.detectedAt]) || record.createdTime?.slice(0, 10) || "",
    reviewAt: asText(fields[FIELDS.reviewAt]),
    ethical: asBoolean(fields[FIELDS.ethical]),
    source: asText(fields[FIELDS.source]),
    notes: asText(fields[FIELDS.notes]),
  };
}

export function calculateGrowthScore(input: {
  expectedRevenue?: number;
  probability?: number;
  expectedCost?: number;
  effort?: number;
  daysToRevenue?: number;
}) {
  const revenue = Math.max(0, input.expectedRevenue ?? 0);
  const probability = Math.min(1, Math.max(0, input.probability ?? 0.5));
  const cost = Math.max(0, input.expectedCost ?? 0);
  const effort = Math.min(10, Math.max(1, input.effort ?? 5));
  const days = Math.max(1, input.daysToRevenue ?? 30);

  // Cuando todavía no hay una estimación monetaria, prioriza probabilidad, rapidez,
  // bajo costo y poco esfuerzo. Así el backlog sigue siendo útil sin inventar ingresos.
  const valueSignal = revenue > 0
    ? Math.min(45, Math.log10(revenue + 10) * 11 * probability)
    : probability * 32;
  const speedSignal = Math.max(0, 25 - Math.log2(days + 1) * 4);
  const effortSignal = Math.max(0, 22 - effort * 2);
  const costPenalty = revenue > 0
    ? Math.min(20, (cost / Math.max(revenue, 1)) * 40)
    : Math.min(20, Math.log10(cost + 1) * 5);

  return Math.max(0, Math.min(100, Math.round(valueSignal + speedSignal + effortSignal - costPenalty + 18)));
}

export async function listGrowthOpportunities() {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    params.append("sort[0][field]", FIELDS.score);
    params.append("sort[0][direction]", "desc");
    if (offset) params.set("offset", offset);
    const page = await airtableFetch<AirtableResponse>(`${TABLE_ID}?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records.map(fromRecord).sort((a, b) => b.score - a.score);
}

function toFields(input: GrowthInput) {
  const score = input.score ?? calculateGrowthScore(input);
  const fields: Record<string, unknown> = {
    [FIELDS.title]: input.title.trim(),
    [FIELDS.status]: input.status ?? "Detectada",
    [FIELDS.category]: input.category ?? "Otra",
    [FIELDS.score]: score,
    [FIELDS.automation]: input.automation ?? "",
    [FIELDS.aiAction]: input.aiAction ?? "",
    [FIELDS.humanAction]: input.humanAction ?? "",
    [FIELDS.nextAction]: input.nextAction ?? "",
    [FIELDS.owner]: input.owner ?? "Ambos",
    [FIELDS.targetMetric]: input.targetMetric ?? "",
    [FIELDS.learning]: input.learning ?? "",
    [FIELDS.detectedAt]: input.detectedAt ?? new Date().toISOString().slice(0, 10),
    [FIELDS.ethical]: input.ethical ?? true,
    [FIELDS.source]: input.source ?? "Growth AI",
    [FIELDS.notes]: input.notes ?? "",
  };

  const optional: Array<[string, unknown]> = [
    [FIELDS.expectedRevenue, input.expectedRevenue],
    [FIELDS.probability, input.probability],
    [FIELDS.expectedCost, input.expectedCost],
    [FIELDS.effort, input.effort],
    [FIELDS.daysToRevenue, input.daysToRevenue],
    [FIELDS.actualRevenue, input.actualRevenue],
    [FIELDS.actualCost, input.actualCost],
    [FIELDS.reviewAt, input.reviewAt],
  ];
  optional.forEach(([field, value]) => {
    if (value !== undefined && value !== "") fields[field] = value;
  });
  return fields;
}

export async function createGrowthOpportunity(input: GrowthInput) {
  if (!input.title?.trim()) throw new Error("La oportunidad necesita un nombre.");
  const payload = await airtableFetch<{ records: AirtableRecord[] }>(TABLE_ID, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields: toFields(input) }], typecast: true }),
  });
  return fromRecord(payload.records[0]);
}

export async function updateGrowthOpportunity(id: string, input: Partial<GrowthInput>) {
  if (!id.startsWith("rec")) throw new Error("Identificador de oportunidad inválido.");
  const current = (await listGrowthOpportunities()).find((item) => item.id === id);
  if (!current) throw new Error("No se encontró la oportunidad.");
  const merged: GrowthInput = { ...current, ...input, title: input.title ?? current.title };
  if (input.score === undefined && ["expectedRevenue", "probability", "expectedCost", "effort", "daysToRevenue"].some((key) => key in input)) {
    merged.score = calculateGrowthScore(merged);
  }
  const payload = await airtableFetch<{ records: AirtableRecord[] }>(TABLE_ID, {
    method: "PATCH",
    body: JSON.stringify({ records: [{ id, fields: toFields(merged) }], typecast: true }),
  });
  return fromRecord(payload.records[0]);
}

function firstNumber(text: string) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function detectGrowthOpportunities() {
  const [dashboard, current] = await Promise.all([getDashboardData(), listGrowthOpportunities()]);
  const existing = new Set(current.map((item) => item.title.toLowerCase()));
  const metrics = new Map(dashboard.metrics.map((metric) => [metric.label, metric]));
  const leads = metrics.get("Leads nuevos");
  const properties = metrics.get("Propiedades activas");
  const matches = metrics.get("Coincidencias");
  const unanswered = firstNumber(leads?.detail ?? "");
  const incomplete = firstNumber(properties?.detail ?? "");
  const strongMatches = firstNumber(matches?.detail ?? "");

  const candidates: GrowthInput[] = [];
  if (unanswered > 0) candidates.push({
    title: "Reducir leads sin primera respuesta",
    category: "Seguimiento compradores",
    probability: 0.85,
    expectedCost: 0,
    effort: 1,
    daysToRevenue: 3,
    automation: "Detectar leads sin respuesta, preparar un mensaje personalizado y crear una próxima acción.",
    aiAction: "Priorizar la bandeja y redactar respuestas para aprobación.",
    humanAction: "Aprobar o ajustar el mensaje y atender la conversación.",
    nextAction: `Resolver los ${unanswered} leads actualmente sin respuesta.`,
    owner: "Ambos",
    targetMetric: "Cero leads nuevos sin respuesta y menor tiempo de primera atención.",
    notes: "Detectada automáticamente a partir del panel operativo.",
  });
  if (incomplete > 0) candidates.push({
    title: "Completar fichas de propiedades activas",
    category: "Ahorro operativo",
    probability: 0.8,
    expectedCost: 0,
    effort: 2,
    daysToRevenue: 7,
    automation: "Listar datos faltantes y generar una solicitud ordenada para completar cada propiedad.",
    aiAction: "Preparar checklist y materiales faltantes por propiedad.",
    humanAction: "Conseguir y validar la información real con el propietario.",
    nextAction: `Completar las ${incomplete} propiedades con información pendiente.`,
    owner: "Ambos",
    targetMetric: "Propiedades activas con ficha completa y listas para publicar.",
    notes: "Detectada automáticamente a partir del panel operativo.",
  });
  if (strongMatches > 0) candidates.push({
    title: "Convertir coincidencias fuertes en visitas",
    category: "Seguimiento compradores",
    probability: 0.8,
    expectedCost: 0,
    effort: 1,
    daysToRevenue: 5,
    automation: "Preparar mensajes que conecten cada demanda con su propiedad compatible y registrar el resultado.",
    aiAction: "Explicar la coincidencia y preparar contacto personalizado.",
    humanAction: "Confirmar disponibilidad y negociar la visita.",
    nextAction: `Revisar y contactar las ${strongMatches} coincidencias fuertes.`,
    owner: "Ambos",
    targetMetric: "Coincidencias contactadas, respuestas y visitas agendadas.",
    notes: "Detectada automáticamente a partir del motor de coincidencias.",
  });

  const created: GrowthOpportunity[] = [];
  for (const candidate of candidates) {
    if (!existing.has(candidate.title.toLowerCase())) created.push(await createGrowthOpportunity(candidate));
  }
  return { created, opportunities: [...created, ...current].sort((a, b) => b.score - a.score) };
}

export async function getGrowthSnapshot(limit = 5) {
  try {
    const opportunities = await listGrowthOpportunities();
    return opportunities.filter((item) => !["Cerrada", "Descartada"].includes(item.status)).slice(0, limit);
  } catch (error) {
    console.error("No se pudo cargar Growth AI", error);
    return [];
  }
}
