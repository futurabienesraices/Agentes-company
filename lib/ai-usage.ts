const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLE_ID = process.env.AIRTABLE_AI_USAGE_TABLE_ID ?? "tblkSZs1Oq2VaI4Iw";

const F = {
  execution: "fldUQVUoSwNoVXiNe", provider: "fldq7GPMUc0QlCJ10", model: "fldVegn189Loa50YA",
  agent: "fldoJNMLICKvEyfFO", task: "fldpZCOOzZjAl6XnD", input: "fld1RwxLPuxGQDciW",
  output: "fldh10FqfYzqrBhYI", total: "fldozQBA8yw6IIQn1", date: "fldQfCp8OH2M54UGF", error: "fld8epiNHapiz3Sa1",
} as const;

export type AiUsage = { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
export type AiBudget = { spent: number; budget: number | null; remaining: number | null; configured: boolean };
type RecordRow = { fields: Record<string, unknown>; createdTime?: string };

function number(fields: Record<string, unknown>, field: string) { return typeof fields[field] === "number" ? fields[field] : 0; }
function monthKey(value: string) { return value.slice(0, 7); }

export async function getAiBudget(): Promise<AiBudget> {
  const configuredBudget = Number(process.env.FUTURA_AI_TOKEN_BUDGET);
  const budget = Number.isFinite(configuredBudget) && configuredBudget > 0 ? configuredBudget : null;
  if (!API_TOKEN) return { spent: 0, budget, remaining: budget, configured: Boolean(budget) };

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?pageSize=100&returnFieldsByFieldId=true`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: "no-store",
    });
    if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
    const payload = await response.json() as { records?: RecordRow[] };
    const currentMonth = monthKey(new Date().toISOString());
    const spent = (payload.records ?? []).filter((record) => monthKey(String(record.fields[F.date] ?? record.createdTime ?? "")) === currentMonth)
      .reduce((total, record) => total + number(record.fields, F.total), 0);
    return { spent, budget, remaining: budget === null ? null : Math.max(0, budget - spent), configured: Boolean(budget) };
  } catch {
    return { spent: 0, budget, remaining: budget, configured: Boolean(budget) };
  }
}

export async function recordAiUsage({ usage, model, task, error }: { usage?: AiUsage; model: string; task: string; error?: string }) {
  if (!API_TOKEN || !usage?.totalTokens) return getAiBudget();
  try {
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ typecast: true, records: [{ fields: {
        [F.execution]: `Gemini · ${new Date().toISOString()}`,
        [F.provider]: "Gemini", [F.model]: model, [F.agent]: "Director IA", [F.task]: task,
        [F.input]: usage.promptTokens ?? 0, [F.output]: usage.candidatesTokens ?? 0,
        [F.total]: usage.totalTokens, [F.date]: new Date().toISOString(), ...(error ? { [F.error]: error } : {}),
      } }] }), cache: "no-store",
    });
  } catch (recordError) { console.error("No se pudo registrar consumo IA", recordError); }
  return getAiBudget();
}
