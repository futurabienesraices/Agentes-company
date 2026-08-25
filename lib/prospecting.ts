const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appqYlISCjGnla9EN";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const PROSPECTS_TABLE = process.env.AIRTABLE_PROSPECTS_TABLE_ID ?? "tbliDv76q4GBKN8V0";

const FIELDS = {
  name: "fldN1tMJxmnknGKjZ", company: "fldmM6yOOtGIWkiPG", phone: "fldNae7w2rBWDEBAF", email: "fldwJxva2NZ8Twpll", profile: "fldRTikG1yCWNpNtO",
  source: "fldnkUdaeN1azGtwk", type: "fldugg7CSuzlCKa6j", interest: "fldPpluXetmwTl7CP", budget: "flduQYiWX8iVfHgKP", zone: "fldhJmvhwfLKs4TkC",
  property: "fldRd6tfCeeqtfdnF", status: "fldvs07JXZNTaIG0Y", score: "fldIg92k5Z0GV96hs", notes: "fldRYxVbhHl83aSPA", date: "fld9XjHEbDM1SxSDS",
} as const;
type AirtableRecord = { id: string; fields: Record<string, unknown>; createdTime?: string };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };
export const PROSPECTING_SOURCES = ["Facebook", "Instagram", "Google", "TikTok", "LinkedIn", "Web", "Referido", "Otro"] as const;
export const PROSPECT_TYPES = ["Comprador", "Inversionista", "Arrendatario", "Propietario", "Otro"] as const;
export const PROSPECT_STATUSES = ["Nuevo", "Por calificar", "Calificado", "Contactado", "Conversación", "Oportunidad", "Descartado"] as const;
export type ProspectingSource = typeof PROSPECTING_SOURCES[number];
export type ProspectType = typeof PROSPECT_TYPES[number];
export type ProspectStatus = typeof PROSPECT_STATUSES[number];
export type Prospect = { id: string; name: string; company: string; phone: string; email: string; profile: string; source: ProspectingSource; type: ProspectType; interest: string; budget: number; zone: string; property: string[]; status: ProspectStatus; score: number; notes: string; date: string };
export type ProspectInput = Omit<Prospect, "id" | "date" | "property"> & { property?: string[] };
function requireToken() { if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN."); return API_TOKEN; }
async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, { ...init, headers: { Authorization: `Bearer ${requireToken()}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store" }); if (!response.ok) throw new Error(`Airtable respondió ${response.status}: ${(await response.text()).slice(0, 300)}`); return response.json() as Promise<T>; }
const text = (v: unknown) => typeof v === "string" ? v : "";
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : 0;
const arr = (v: unknown) => Array.isArray(v) ? v.map(String) : [];
function fromRecord(r: AirtableRecord): Prospect { const f = r.fields; return { id:r.id, name:text(f[FIELDS.name]), company:text(f[FIELDS.company]), phone:text(f[FIELDS.phone]), email:text(f[FIELDS.email]), profile:text(f[FIELDS.profile]), source:(text(f[FIELDS.source])||"Otro") as ProspectingSource, type:(text(f[FIELDS.type])||"Otro") as ProspectType, interest:text(f[FIELDS.interest]), budget:num(f[FIELDS.budget]), zone:text(f[FIELDS.zone]), property:arr(f[FIELDS.property]), status:(text(f[FIELDS.status])||"Nuevo") as ProspectStatus, score:num(f[FIELDS.score]), notes:text(f[FIELDS.notes]), date:text(f[FIELDS.date])||r.createdTime||"" }; }
async function listRecords() { const records:AirtableRecord[]=[]; let offset:string|undefined; do { const p=new URLSearchParams({pageSize:"100",returnFieldsByFieldId:"true"}); p.append("sort[0][field]",FIELDS.date); p.append("sort[0][direction]","desc"); if(offset)p.set("offset",offset); const page=await airtableFetch<AirtableResponse>(`${PROSPECTS_TABLE}?${p}`); records.push(...page.records); offset=page.offset; } while(offset); return records; }
export async function getProspectingData() { const prospects=(await listRecords()).map(fromRecord); return { prospects:prospects.slice(0,100), total:prospects.length, qualified:prospects.filter(p=>p.score>=70&&p.status!=="Descartado").length, sources:[...new Set(prospects.map(p=>p.source))] }; }
export async function addProspect(input:ProspectInput) { const fields:Record<string,unknown>={ [FIELDS.name]:input.name.trim(), [FIELDS.company]:input.company?.trim()||"", [FIELDS.phone]:input.phone?.trim()||"", [FIELDS.email]:input.email?.trim()||"", [FIELDS.profile]:input.profile?.trim()||"", [FIELDS.source]:input.source, [FIELDS.type]:input.type, [FIELDS.interest]:input.interest?.trim()||"", [FIELDS.budget]:Math.max(0,Math.round(input.budget||0)), [FIELDS.zone]:input.zone?.trim()||"", [FIELDS.status]:input.status||"Nuevo", [FIELDS.score]:Math.min(100,Math.max(0,Math.round(input.score||0))), [FIELDS.notes]:input.notes?.trim()||"", [FIELDS.date]:new Date().toISOString().slice(0,10) }; if(input.property?.length) fields[FIELDS.property]=input.property; const payload=await airtableFetch<{records:AirtableRecord[]}>(PROSPECTS_TABLE,{method:"POST",body:JSON.stringify({records:[{fields}],typecast:true})}); return fromRecord(payload.records[0]); }
