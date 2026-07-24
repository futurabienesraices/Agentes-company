import { NextResponse } from "next/server";
import { getGrowthSnapshot } from "../../../lib/growth";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Metric = { label: string; value: number; detail?: string };
type Item = { title: string; detail: string; tone?: string };
type PendingAction = { type: "create_task"; title: string; dueAt?: string; priority?: string };
type Prospect = { name: string; type?: string; sourceUrl?: string; reason?: string; channel?: string };
type Campaign = {
  name: string;
  objective: string;
  audience: string;
  angle: string;
  socialPost: string;
  longPost: string;
  emailSubject: string;
  emailBody: string;
  whatsapp: string;
  videoScript: string;
  callToAction: string;
  channels: string[];
  metrics: string[];
};

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

function wantsCampaign(text: string) {
  const normalized = text.toLowerCase();
  return /(crea|crear|genera|generar|diseña|diseñar|prepara|preparar)/.test(normalized) && /(campaña|contenido|anuncio|publicación|publicaciones|correo|email|video|reel|redes)/.test(normalized);
}

function needsResearch(text: string) {
  return ["mercado", "competencia", "precio", "zona", "tendencia", "investiga", "investigar", "buscar leads", "buscar clientes", "prospectar", "prospectos", "oportunidades", "medios", "canales", "inversionistas", "compradores", "empresas"].some((term) => text.toLowerCase().includes(term));
}

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function parseResearch(text: string): { answer: string; prospects: Prospect[] } {
  try {
    const parsed = JSON.parse(cleanJson(text)) as { answer?: string; prospects?: Prospect[] };
    return { answer: parsed.answer?.trim() || "Investigación completada.", prospects: Array.isArray(parsed.prospects) ? parsed.prospects.slice(0, 8) : [] };
  } catch {
    return { answer: text.trim(), prospects: [] };
  }
}

function parseCampaign(text: string): { answer: string; campaign?: Campaign } {
  try {
    const parsed = JSON.parse(cleanJson(text)) as { answer?: string; campaign?: Campaign };
    if (!parsed.campaign) return { answer: parsed.answer?.trim() || "No pude estructurar la campaña." };
    return { answer: parsed.answer?.trim() || "Campaña lista para revisión.", campaign: parsed.campaign };
  } catch {
    return { answer: text.trim() };
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

    const campaignMode = wantsCampaign(latestPrompt);
    const researchMode = !campaignMode && needsResearch(latestPrompt);
    const growth = await getGrowthSnapshot(4);
    const businessContext = JSON.stringify({
      metrics: context.metrics ?? [],
      priorities: (context.priorities ?? []).slice(0, 8),
      insights: (context.insights ?? []).slice(0, 6),
      growth: growth.map((item) => ({ title: item.title, score: item.score, status: item.status, nextAction: item.nextAction, aiAction: item.aiAction, humanAction: item.humanAction, metric: item.targetMetric })),
    });

    const structuredInstruction = campaignMode
      ? `\nDevuelve exclusivamente JSON válido con esta forma: {"answer":"resumen breve","campaign":{"name":"nombre de campaña","objective":"objetivo medible","audience":"perfil de cliente ideal","angle":"ángulo principal","socialPost":"texto corto para redes","longPost":"publicación larga","emailSubject":"asunto","emailBody":"correo completo","whatsapp":"mensaje de WhatsApp","videoScript":"guion de video corto de 30 a 45 segundos","callToAction":"llamada a la acción","channels":["canal 1","canal 2"],"metrics":["métrica 1","métrica 2"]}}. No inventes datos concretos de una propiedad que el usuario no haya dado. Cuando falten detalles, crea una campaña base y señala qué información debe personalizarse.`
      : researchMode
        ? `\nDevuelve exclusivamente JSON válido con esta forma: {"answer":"resumen ejecutivo breve en español","prospects":[{"name":"organización, empresa, asociación o prospecto comercial público","type":"tipo","sourceUrl":"URL pública exacta","reason":"por qué encaja","channel":"canal comercial público sugerido"}]}. Incluye máximo 8 prospectos verificables. No inventes nombres, contactos ni URLs. Si no encuentras prospectos confiables, devuelve prospects vacío.`
        : "";

    const input = [{ role: "developer", content: `Eres Futura, Director IA de Futura OS. Diriges un negocio digital y automatizado. Responde siempre en español, con claridad, brevedad y enfoque en decisiones. Usa los datos internos proporcionados sin inventar cifras. Tu equipo incluye Growth AI, Investigador de Mercado, Prospector, Analista de Oportunidades, Creador de Contenido, Difusión, Contacto y Seguimiento. Growth AI mantiene el backlog de monetización: cuando la conversación trate sobre crecimiento, empieza por la oportunidad activa con mayor puntuación, explica qué puede ejecutar la IA, qué requiere acción humana y qué métrica debe medirse. No alteres el backlog ni afirmes que una acción fue ejecutada sin confirmación. Para campañas, produce materiales persuasivos, claros, específicos y éticos, sin promesas engañosas ni afirmaciones no verificadas. Sólo utiliza fuentes públicas y legítimas. No expongas datos personales sensibles ni afirmes que contactaste o publicaste algo si no ocurrió. Contexto actual: ${businessContext}${structuredInstruction}` }, ...messages.map((message) => ({ role: message.role, content: message.content }))];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", input, ...(researchMode ? { tools: [{ type: "web_search" }], tool_choice: "auto" } : {}), max_output_tokens: campaignMode ? 2200 : researchMode ? 1400 : 500, store: false }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("OpenAI respondió con error", payload);
      return NextResponse.json({ error: "Futura no pudo responder en este momento." }, { status: 502 });
    }

    const raw = extractOutputText(payload).trim();
    if (!raw) return NextResponse.json({ error: "Futura devolvió una respuesta vacía." }, { status: 502 });
    if (campaignMode) {
      const result = parseCampaign(raw);
      return NextResponse.json({ answer: result.answer, campaign: result.campaign, mode: "campaign" });
    }
    if (researchMode) {
      const result = parseResearch(raw);
      return NextResponse.json({ answer: result.answer, prospects: result.prospects, mode: "research" });
    }
    return NextResponse.json({ answer: raw, mode: "operations", growthTop: growth[0] ?? null });
  } catch (error) {
    console.error("Error en Director IA", error);
    return NextResponse.json({ error: "No se pudo procesar la consulta." }, { status: 500 });
  }
}
