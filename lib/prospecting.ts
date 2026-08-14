const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const MEMORY_TABLE = process.env.AIRTABLE_PROSPECT_MEMORY_TABLE_ID ?? "tblyhpQStNo0ly4D6";
const LEADS_TABLE = "tblUxwYmD7Gliahzs";

const FIELDS = {
  title: "fldBYmw6Qipj8AeDp",
  prospect: "fld5Y8XbjBfAILIr4",
  source: "fldFZjD1VtnYhawmt",
  event: "fldoOWKfCwsroni1S",
  summary: "fldliliCEabwA9r7u",
  url: "fldGYyJeHoJ82esJF",
  confidence: "fld8xUIBwcv7d0jkY",
  score: "fldlIR9aIJyYqEMR5",
  recommendedAction: "fldRnUsj4DWWujFNq",
  legalBasis: "fldq0IvktUTWqf3pH",
  date: "fld43VYeJLnXkpoAd",
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

export const PROSPECTING_SOURCES = ["Google Places", "Google Trends", "Meta Pages", "Proveedor B2B", "Sitio web público", "Carga manual"] as const;
export const LEGAL_BASES = ["Pendiente de revisión", "Dato público profesional", "Licencia del proveedor", "Consentimiento", "No usar"] as const;

export type ProspectingSource = typeof PROSPECTING_SOURCES[number];
export type LegalBasis = typeof LEGAL_BASES[number];
export type ProspectMemory = {
  id: string;
  title: string;
  prospect: string;
  source: ProspectingSource;
  event: string;
  summary: string;
  url: string;
  confidence: number;
  score: number;
  recommendedAction: string;
  legalBasis: LegalBasis;
  date: string;
};

export type ProspectMemoryInput = Omit<ProspectMemory, "id" | "date">;

function requireToken() {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN.");
  return API_TOKEN;
}

async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${requireToken()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Airtable respondió ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json() as Promise<T>;
}

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

function fromRecord(record: AirtableRecord): ProspectMemory {
  const fields = record.fields;
  return {
    id: record.id,
    title: text(fields[FIELDS.title]) || "Actividad sin título",
    prospect: text(fields[FIELDS.prospect]),
    source: (text(fields[FIELDS.source]) || "Carga manual") as ProspectingSource,
    event: text(fields[FIELDS.event]) || "Descubierto",
    summary: text(fields[FIELDS.summary]),
    url: text(fields[FIELDS.url]),
    confidence: number(fields[FIELDS.confidence]),
    score: number(fields[FIELDS.score]),
    recommendedAction: text(fields[FIELDS.recommendedAction]),
    legalBasis: (text(fields[FIELDS.legalBasis]) || "Pendiente de revisión") as LegalBasis,
    date: text(fields[FIELDS.date]) || record.createdTime || "",
  };
}

export async function getProspectingData() {
  const memoryParams = new URLSearchParams({ pageSize: "50", returnFieldsByFieldId: "true" });
  memoryParams.append("sort[0][field]", FIELDS.date);
  memoryParams.append("sort[0][direction]", "desc");
  const [memoryPage, leadsPage] = await Promise.all([
    airtableFetch<AirtableResponse>(`${MEMORY_TABLE}?${memoryParams}`),
    airtableFetch<AirtableResponse>(`${LEADS_TABLE}?pageSize=100&returnFieldsByFieldId=true`),
  ]);
  const memory = memoryPage.records.map(fromRecord);
  return { memory, leadCount: leadsPage.records.length, highValueCount: memory.filter((item) => item.score >= 70 && item.legalBasis !== "No usar").length };
}

export async function addProspectMemory(input: ProspectMemoryInput) {
  const fields: Record<string, unknown> = {
    [FIELDS.title]: input.title.trim(),
    [FIELDS.prospect]: input.prospect.trim(),
    [FIELDS.source]: input.source,
    [FIELDS.event]: input.event || "Descubierto",
    [FIELDS.summary]: input.summary.trim(),
    [FIELDS.confidence]: Math.min(100, Math.max(0, Math.round(input.confidence))),
    [FIELDS.score]: Math.min(100, Math.max(0, Math.round(input.score))),
    [FIELDS.recommendedAction]: input.recommendedAction.trim(),
    [FIELDS.legalBasis]: input.legalBasis,
    [FIELDS.date]: new Date().toISOString(),
  };
  if (input.url.trim()) fields[FIELDS.url] = input.url.trim();
  const payload = await airtableFetch<{ records: AirtableRecord[] }>(MEMORY_TABLE, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  return fromRecord(payload.records[0]);
}
