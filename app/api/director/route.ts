import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Metric = { label: string; value: number; detail?: string };
type Item = { title: string; detail: string; tone?: string };
type PendingAction = { type: "create_task"; title: string; dueAt?: string; priority?: string };
type Prospect = { name: string; type?: string; sourceUrl?: string; reason?: string; channel?: string };

type RequestBody = {
  messages?: ChatMessage[];
  context?: { metrics?: Metric[]; priorities?: Item[]; insights?: Item[] };
};

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (response.output_text) return response.output_text;
  return response.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text).join("\n") ?? "";
}

function dateFromPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  const explicit = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (explicit) return explicit;
  const date = new Date();
  if (normalized.includes("mañana")) date.setDate(date.getDate() + 1);
  else if (!normalized.includes("hoy")) return undefined;
  return date.toISOString().slice(0, 10);
}

function taskActionFromPrompt(prompt: string): PendingAction | null {
  const normalized = prompt.toLowerCase();
  const requestsCreation = /(crea|crear|agenda|agendar|programa|programar|añade|agrega)/.test(normalized);
  const isTask = /(tarea|seguimiento|recordatorio|contactar|llamar|responder)/.test(normalized);
  if (!requestsCreation || !isTask) return null;
  const cleaned = prompt.replace(/^(futura[,\s]*)?/i, "").replace(/\b(crea|crear|agenda|agendar|programa|programar|añade|agrega)\b/gi, "").replace(/\b(una|un|la|el)\b/gi, "").replace(/\b(tarea|recordatorio)\b/gi, "").replace(/\b(hoy|mañana|para hoy|para mañana)\b/gi, "").replace(/\s+/g, " ").trim();
  return { type: "create_task", title: cleaned || "Seguimiento comercial", dueAt: dateFromPrompt(prompt), priority: normalized.includes("urgente") || normalized.includes("alta prioridad") ? "Alta" : "Media" };
}

function needsResearch(text: string) {
  return ["mercado", "competencia", "precio", "zona", "tendencia", "investiga", "investigar", "buscar leads", "buscar clientes", "prospectar", "prospectos", "oportunidades", "medios", "canales", "contenido", "campaña", "correo", "email", "publicidad", "anuncio", "inversionistas", "compradores", "empresas", "contactar"].some((term) => text.toLowerCase().includes(term));
}

function parseResearch(text: string): { answer: string; prospects: Prospect[] } {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { answer?: string; prospects?: Prospect[] };
    return { answer: parsed.answer?.trim() || "Investigación completada.", prospects: Array.isArray(parsed.prospects) ? parsed.prospects.slice(0, 8) : [] };
  } catch {
    return { answer: text.trim(), prospects: [] };
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const messages = (body.messages ?? []).slice(-12);
    const context = body.context ?? {};
    if (!messages.length || messages[messages.length - 1]?.role !== "user") return NextResponse.json({ error: "Falta una consulta válida." }, { status: 400 });

    const latestPrompt = messages[messages.length - 1].content;
    const pendingAction = taskActionFromPrompt(latestPrompt);
    if (pendingAction) {
      const dateText = pendingAction.dueAt ? ` para ${pendingAction.dueAt}` : "";
      return NextResponse.json({ answer: `Puedo crear la tarea “${pendingAction.title}”${dateText} con prioridad ${pendingAction.priority}. Confirma para registrarla en Airtable.`, pendingAction });
    }

    const researchMode = needsResearch(latestPrompt);
    const businessContext = JSON.stringify({ metrics: context.metrics ?? [], priorities: (context.priorities ?? []).slice(0, 8), insights: (context.insights ?? []).slice(0, 6) });
    const researchInstruction = researchMode ? `\nDevuelve exclusivamente JSON válido con esta forma: {"answer":"resumen ejecutivo breve en español","prospects":[{"name":"organización, empresa, asociación o prospecto comercial público","type":"tipo","sourceUrl":"URL pública exacta","reason":"por qué encaja","channel":"canal comercial público sugerido"}]}. Incluye máximo 8 prospectos verificables. No inventes nombres, contactos ni URLs. Si no encuentras prospectos confiables, devuelve prospects vacío.` : "";

    const input = [{ role: "developer", content: `Eres Futura, Director IA de Futura OS. Diriges un negocio digital y automatizado. Responde siempre en español, con claridad, brevedad y enfoque en decisiones. Usa los datos internos proporcionados sin inventar cifras. Cuando la consulta requiera información externa, investiga en la web y distingue entre datos internos, hallazgos externos e inferencias. Tu equipo incluye Investigador de Mercado, Prospector, Analista de Oportunidades, Creador de Contenido, Difusión, Contacto y Seguimiento. Sólo utiliza fuentes públicas y legítimas. Prioriza empresas, asociaciones, portales, eventos y canales comerciales publicados. No expongas datos personales sensibles ni afirmes que contactaste a alguien. Contexto actual: ${businessContext}${researchInstruction}` }, ...messages.map((message) => ({ role: message.role, content: message.content }))];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", input, ...(researchMode ? { tools: [{ type: "web_search" }], tool_choice: "auto" } : {}), max_output_tokens: researchMode ? 1400 : 500, store: false }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("OpenAI respondió con error", payload);
      return NextResponse.json({ error: "Futura no pudo responder en este momento." }, { status: 502 });
    }

    const raw = extractOutputText(payload).trim();
    if (!raw) return NextResponse.json({ error: "Futura devolvió una respuesta vacía." }, { status: 502 });
    if (researchMode) {
      const result = parseResearch(raw);
      return NextResponse.json({ answer: result.answer, prospects: result.prospects, mode: "research" });
    }
    return NextResponse.json({ answer: raw, mode: "operations" });
  } catch (error) {
    console.error("Error en Director IA", error);
    return NextResponse.json({ error: "No se pudo procesar la consulta." }, { status: 500 });
  }
}
