/**
 * Airtable Client — Futura OS
 * Single centralized client for all Airtable operations.
 * All modules should import from here instead of duplicating fetch logic.
 */

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TIME_ZONE = process.env.FUTURA_TIME_ZONE ?? "America/El_Salvador";

// ─── Table IDs ────────────────────────────────────────────────────────
export const TABLES = {
  properties: "tblZifOElWQtGaXHM",
  leads: "tblUxwYmD7Gliahzs",
  demands: "tblI0HtmgfOIKzzvs",
  followUps: "tbl5G7PfXax3WafYE",
  tasks: "tblP1NK4FnlO5pHTr",
  matches: "tbl3wXENYvxuUAR7R",
  publications: "tblEmH9qmv71N6YNC",
  visits: "tblOsY6wXA3L6PZtV",
  offers: "tblrsZAPjijpSLHpC",
  growth: process.env.AIRTABLE_GROWTH_TABLE_ID ?? "tbl1xmcrEJWcZY0gL",
  aiUsage: process.env.AIRTABLE_AI_USAGE_TABLE_ID ?? "tblkSZs1Oq2VaI4Iw",
  campaigns: process.env.AIRTABLE_CAMPAIGNS_TABLE_ID ?? "tblVwnFd08m65h6Y4",
  prospects: process.env.AIRTABLE_PROSPECTS_TABLE_ID ?? "tbliDv76q4GBKN8V0",
} as const;

// ─── Field IDs (by table) ─────────────────────────────────────────────
export const FIELD = {
  properties: {
    title: "fldcDIOahahyHurDm",
    code: "fldBHH1Ki3jmVIGwB",
    commercialStatus: "fldAN7GBFy247BShJ",
    preparation: "fldMEZNUrfGqkbd0v",
    missing: "fldcTVWJJ2USr5Lmq",
    updatedAt: "fld9wzxnvWYNinWkY",
    photos: "fldQQvVkOUp4WavD9",
    type: "fldzkccNuERBm2Ybq",
    operation: "fldm7rV2anSTjGpgp",
    price: "fldvcBlG4w3yfUYIy",
    area: "fldd6e2CkUyHE3XY1",
    bedrooms: "fldOkU0sslGhy1aWj",
    bathrooms: "fldAqffjwsOVxNp7A",
    parking: "fldkHChhExIt7bWCC",
    zone: "fldcvNHcJkzuYhs6a",
    municipality: "fldujbgyGoy7aSuwT",
    amenities: "fldK0GXTFBpgqQ73P",
    summary: "fldJwIRMLyLGvV6WV",
    video: "fldiuy6xBIR8DitBV",
    drive: "fldjHsFW7t6busza2",
    completion: "fldnP2bAyvDlJgDxI",
    publishedAt: "flde0etPNA2Vabkz1",
    priority: "fldwKZGKdEybym5z9",
    availability: "fldj9molLkGpK6SXR",
  },
  leads: {
    name: "fldA9qI2kUKyv64JY",
    classification: "fldgS0dl95nJxdrE0",
    priority: "fldshPdum09OCTKW3",
    response: "fld6kfblYoaareLKg",
    enteredAt: "fldgb694pdT82sI8D",
    stage: "fldwlapkEP4rEJlnl",
    channel: "flduBfRO0rLLZq1WD",
    phone: "fldBAVL33laSAVf1q",
  },
  demands: {
    name: "fld8IM8S3g9oBCONp",
    state: "fldIDXeMa3BPcRKRy",
    operation: "fldG7zFdEQMSgMK4i",
    propertyType: "fldyr37i8tbXghWk9",
    location: "fldUGmROgYr3CByJC",
    budgetMax: "fldwLBaTLOJub2Umq",
    budgetMin: "fldf0RzJZ7tpruvcc",
    areaMin: "fldFFhfUm27Mq8TEz",
    bedroomsMin: "fldKuVwZkbC4TewYy",
    bathroomsMin: "fldoKI1KHFGK7vxRT",
    paymentMode: "fldjqa03S4kXfhB2m",
  },
  followUps: {
    name: "fldXsuexoOflUM3e8",
    status: "fldmE4yR7BznYlT36",
    nextAction: "fldNrTzmiZlZokwkv",
    dueAt: "fldCStsSMMq6MPsVv",
  },
  tasks: {
    name: "fldZXN2c7B9pHKQbz",
    notes: "fldjK0f8YCBnaThur",
    status: "fldF1T4stbMxv5sbm",
    priority: "fldd3t4Kn7NasxlNx",
    dueAt: "fldpuv4cHJ5XfivND",
    automatable: "fldPa0mFZe9dBh9MM",
  },
  matches: {
    name: "fldcN3S7JuCEMfMBU",
    demand: "fldkqQeJ6yijyuNU4",
    property: "fldErUvbjRMa8QufO",
    score: "fld6wMqUlJQKd2zUj",
    level: "fldOa3LyT35TzuX0P",
    state: "fldkVRk98alu41J1X",
    reasons: "fldtyPRV7eH5wPmaw",
    alerts: "fldTfDGzlSCuCuw7Y",
    calculatedAt: "fld9UcWdRNz4SE52i",
    humanReview: "fldlFnQVKTxOSjWhk",
  },
  publications: {
    name: "fldTy8MIdTsjsQKvK",
    status: "fld4VPWXT1Hn6p5jA",
    property: "fldvHtWJ1Mq153e1t",
    channel: "fldyyNpqVPFLQ66MI",
    date: "fldKMGodj9Z0Q3Pu8",
    queries: "fldQEozb6jO2RZKHB",
  },
  visits: {
    name: "fldDiLoHJDLE2iy4B",
    status: "fldfiVykzucG4N0C8",
    date: "fldwAKwmRAiRnW6zL",
  },
  offers: {
    name: "fldp7VZMnrqwPkSPR",
    status: "fldLRwtXEWkOVsEvY",
  },
  growth: {
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
  },
  aiUsage: {
    execution: "fldUQVUoSwNoVXiNe",
    provider: "fldq7GPMUc0QlCJ10",
    model: "fldVegn189Loa50YA",
    agent: "fldoJNMLICKvEyfFO",
    task: "fldpZCOOzZjAl6XnD",
    input: "fld1RwxLPuxGQDciW",
    output: "fldh10FqfYzqrBhYI",
    total: "fldozQBA8yw6IIQn1",
    date: "fldQfCp8OH2M54UGF",
    error: "fld8epiNHapiz3Sa1",
  },
  campaigns: {
    title: "fldZ76zPviYx3a84p",
    property: "fldCvFg3brwHc3h0X",
    propertyName: "fld3b99doQOKNIG0S",
    status: "fldqgDnI5WpIfuySI",
    scheduledFor: "fldk7BlbcpaSYfDlS",
    channels: "fldUG9vdadcWYzr2R",
    objective: "fld3RYxlezvnqBmU5",
    angle: "fldaIWiZ6nVE2C3hw",
    plan: "fld5UEF1qRe5h3FVa",
    externalSync: "fldw6FGEunTl5nRgW",
    updatedAt: "fld324XYVUZX5I1UK",
  },
  prospects: {
    name: "fldN1tMJxmnknGKjZ",
    company: "fldmM6yOOtGIWkiPG",
    phone: "fldNae7w2rBWDEBAF",
    email: "fldwJxva2NZ8Twpll",
    profile: "fldRTikG1yCWNpNtO",
    source: "fldnkUdaeN1azGtwk",
    type: "fldugg7CSuzlCKa6j",
    interest: "fldPpluXetmwTl7CP",
    budget: "flduQYiWX8iVfHgKP",
    zone: "fldhJmvhwfLKs4TkC",
    property: "fldRd6tfCeeqtfdnF",
    status: "fldvs07JXZNTaIG0Y",
    score: "fldIg92k5Z0GV96hs",
    notes: "fldRYxVbhHl83aSPA",
    date: "fld9XjHEbDM1SxSDS",
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────
export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

type AirtableResponse = {
  records: AirtableRecord[];
  offset?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

/** Check token exists */
function requireToken(): string {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN.");
  return API_TOKEN;
}

/** Check if API token is configured (without throwing) */
export function isConfigured(): boolean {
  return Boolean(API_TOKEN);
}

/** Low-level fetch wrapper for Airtable REST API */
export async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

/** Fetch all records from a table with pagination */
export async function listAll(tableId: string, options?: {
  returnFieldsByFieldId?: boolean;
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  filterByFormula?: string;
}): Promise<AirtableRecord[]> {
  requireToken();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (options?.returnFieldsByFieldId !== false) {
      params.set("returnFieldsByFieldId", "true");
    }
    if (options?.sort) {
      options.sort.forEach((s, i) => {
        params.append(`sort[${i}][field]`, s.field);
        params.append(`sort[${i}][direction]`, s.direction);
      });
    }
    if (options?.filterByFormula) {
      params.set("filterByFormula", options.filterByFormula);
    }
    if (offset) params.set("offset", offset);

    const page = await airtableFetch<AirtableResponse>(`${tableId}?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

/** Create records in a table (max 10 per batch) */
export async function createRecords(
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>,
  options?: { typecast?: boolean }
): Promise<AirtableRecord[]> {
  const created: AirtableRecord[] = [];
  const typecast = options?.typecast ?? true;

  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const payload = await airtableFetch<{ records: AirtableRecord[] }>(tableId, {
      method: "POST",
      body: JSON.stringify({ records: batch, typecast }),
    });
    created.push(...payload.records);
  }

  return created;
}

/** Create a single record */
export async function createRecord(
  tableId: string,
  fields: Record<string, unknown>,
  options?: { typecast?: boolean }
): Promise<AirtableRecord> {
  const results = await createRecords(tableId, [{ fields }], options);
  return results[0];
}

/** Update records in a table (max 10 per batch) */
export async function updateRecords(
  tableId: string,
  records: Array<{ id: string; fields: Record<string, unknown> }>,
  options?: { typecast?: boolean }
): Promise<AirtableRecord[]> {
  const updated: AirtableRecord[] = [];
  const typecast = options?.typecast ?? true;

  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const payload = await airtableFetch<{ records: AirtableRecord[] }>(tableId, {
      method: "PATCH",
      body: JSON.stringify({ records: batch, typecast }),
    });
    updated.push(...payload.records);
  }

  return updated;
}

/** Update a single record */
export async function updateRecord(
  tableId: string,
  id: string,
  fields: Record<string, unknown>,
  options?: { typecast?: boolean }
): Promise<AirtableRecord> {
  const payload = await airtableFetch<AirtableRecord>(`${tableId}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: options?.typecast ?? true }),
  });
  return payload;
}

/** Upsert records using fieldsToMergeOn */
export async function upsertRecords(
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>,
  fieldsToMergeOn: string[]
): Promise<void> {
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    await airtableFetch(tableId, {
      method: "PATCH",
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn },
        typecast: true,
        records: batch,
      }),
    });
  }
}

// ─── Field value extractors ──────────────────────────────────────────

export function text(fields: Record<string, unknown>, fieldId: string): string {
  const v = fields[fieldId];
  return typeof v === "string" ? v : "";
}

export function num(fields: Record<string, unknown>, fieldId: string): number {
  const v = fields[fieldId];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function optNum(fields: Record<string, unknown>, fieldId: string): number | undefined {
  const v = fields[fieldId];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function select(fields: Record<string, unknown>, fieldId: string): string {
  const v = fields[fieldId];
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "name" in v && typeof v.name === "string") return v.name;
  return "";
}

export function links(fields: Record<string, unknown>, fieldId: string): string[] {
  const v = fields[fieldId];
  return Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];
}

export function photos(fields: Record<string, unknown>, fieldId: string): string[] {
  const v = fields[fieldId];
  return Array.isArray(v)
    ? v.flatMap((file) =>
        typeof file === "object" && file && "url" in file && typeof file.url === "string" ? [file.url] : []
      )
    : [];
}

export function list(fields: Record<string, unknown>, fieldId: string): string[] {
  const v = fields[fieldId];
  return Array.isArray(v)
    ? v.flatMap((item) =>
        typeof item === "string"
          ? [item]
          : item && typeof item === "object" && "name" in item && typeof item.name === "string"
            ? [item.name]
            : []
      )
    : [];
}

export function bool(fields: Record<string, unknown>, fieldId: string): boolean {
  return fields[fieldId] === true;
}

// ─── Date/Time helpers ──────────────────────────────────────────────

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function daysSince(date: string): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime();
  return Number.isFinite(parsed) ? Math.floor((Date.now() - parsed) / 86_400_000) : Number.POSITIVE_INFINITY;
}

export function monthKey(value: string): string {
  return value.slice(0, 7);
}

// ─── Status helpers ─────────────────────────────────────────────────

export function isClosed(status: string): boolean {
  const n = status.toLowerCase().trim();
  return [
    "done", "cerrada", "cerrado", "completada", "completado",
    "descartada", "descartado", "publicada", "realizada",
    "aceptada", "rechazada", "cancelada", "cancelado",
  ].includes(n);
}

export function isOpen(status: string): boolean {
  return !isClosed(status);
}

export function normalizeStatus(status: string): string {
  const v = status.trim();
  if (!v || ["todo", "todos", "all"].includes(v.toLowerCase())) return "Pendiente";
  return v;
}

export function priorityRank(value: string): number {
  return value === "Urgente" ? 4 : value === "Alta" ? 3 : value === "Media" ? 2 : 1;
}

export function missingItems(value: string): string[] {
  return value && value !== "Ninguno registrado"
    ? value.split(/,|\n/).map((item) => item.trim()).filter(Boolean)
    : [];
}

// ─── Constants ──────────────────────────────────────────────────────

export const CRM_STAGES = [
  "Nuevo lead", "Contactado", "Calificado", "Interesado",
  "Visita", "Negociación", "Cierre", "Perdido",
] as const;

export { TIME_ZONE };
