const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLE_ID = process.env.AIRTABLE_CAMPAIGNS_TABLE_ID ?? "tblVwnFd08m65h6Y4";

const FIELDS = {
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
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

export const CAMPAIGN_STATUSES = ["Borrador", "Aprobada", "Programada", "Activa", "Pausada", "Completada", "Cancelada"] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];
export type CampaignPlan = { classification: string; objective: string; angle: string; recommendation: string; cadence: string; carousel: { slide: number; title: string; copy: string }[]; pieces: { format: string; channel: string; title: string; body: string; cta: string }[]; metrics: string[] };
export type Campaign = { id: string; title: string; propertyId: string; property: string; status: CampaignStatus; scheduledFor: string; channels: string[]; objective: string; angle: string; plan: CampaignPlan | null; externalSync: string; updatedAt: string };
export type CampaignInput = Omit<Campaign, "id" | "externalSync" | "updatedAt">;

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
const select = (value: unknown) => typeof value === "string" ? value : value && typeof value === "object" && "name" in value && typeof value.name === "string" ? value.name : "";
const list = (value: unknown) => Array.isArray(value) ? value.flatMap((item) => typeof item === "string" ? [item] : item && typeof item === "object" && "name" in item && typeof item.name === "string" ? [item.name] : []) : [];

function parsePlan(value: unknown): CampaignPlan | null {
  if (typeof value !== "string") return null;
  try { return JSON.parse(value) as CampaignPlan; }
  catch { return null; }
}

function fromRecord(record: AirtableRecord): Campaign {
  const fields = record.fields;
  const rawPropertyLinks = fields[FIELDS.property];
  const propertyLinks: unknown[] = Array.isArray(rawPropertyLinks) ? rawPropertyLinks : [];
  return {
    id: record.id,
    title: text(fields[FIELDS.title]) || "Campaña sin título",
    propertyId: typeof propertyLinks[0] === "string" ? propertyLinks[0] : "",
    property: text(fields[FIELDS.propertyName]) || "Propiedad sin nombre",
    status: (select(fields[FIELDS.status]) || "Borrador") as CampaignStatus,
    scheduledFor: text(fields[FIELDS.scheduledFor]),
    channels: list(fields[FIELDS.channels]),
    objective: text(fields[FIELDS.objective]),
    angle: text(fields[FIELDS.angle]),
    plan: parsePlan(fields[FIELDS.plan]),
    externalSync: select(fields[FIELDS.externalSync]) || "No exportada",
    updatedAt: text(fields[FIELDS.updatedAt]) || record.createdTime || "",
  };
}

export async function listCampaigns() {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);
    const page = await airtableFetch<AirtableResponse>(`${TABLE_ID}?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records.map(fromRecord).sort((a, b) => (a.scheduledFor || "9999").localeCompare(b.scheduledFor || "9999"));
}

function campaignFields(input: CampaignInput | Partial<Pick<Campaign, "status" | "scheduledFor">>) {
  const fields: Record<string, unknown> = {};
  if ("title" in input) {
    fields[FIELDS.title] = input.title;
    fields[FIELDS.propertyName] = input.property;
    if (input.propertyId?.startsWith("rec")) fields[FIELDS.property] = [input.propertyId];
    fields[FIELDS.channels] = input.channels;
    fields[FIELDS.objective] = input.objective;
    fields[FIELDS.angle] = input.angle;
    fields[FIELDS.plan] = input.plan ? JSON.stringify(input.plan) : "";
    fields[FIELDS.externalSync] = "No exportada";
  }
  if (input.status) fields[FIELDS.status] = input.status;
  if ("scheduledFor" in input) fields[FIELDS.scheduledFor] = input.scheduledFor || null;
  fields[FIELDS.updatedAt] = new Date().toISOString();
  return fields;
}

export async function createCampaign(input: CampaignInput) {
  const payload = await airtableFetch<{ records: AirtableRecord[] }>(TABLE_ID, { method: "POST", body: JSON.stringify({ records: [{ fields: campaignFields(input) }], typecast: true }) });
  return fromRecord(payload.records[0]);
}

export async function updateCampaign(id: string, input: Partial<Pick<Campaign, "status" | "scheduledFor">>) {
  const payload = await airtableFetch<AirtableRecord>(`${TABLE_ID}/${id}`, { method: "PATCH", body: JSON.stringify({ fields: campaignFields(input), typecast: true }) });
  return fromRecord(payload);
}
