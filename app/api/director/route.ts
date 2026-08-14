import { NextResponse } from "next/server";
import { getGrowthSnapshot } from "../../../lib/growth";

type ChatMessage = { role: "user" | "assistant"; content: string };
type PendingAction = { type: "create_task"; title: string; dueAt?: string; priority?: string };
type Prospect = { name: string; type?: string; sourceUrl?: string; reason?: string; channel?: string };
type Campaign = {
  name: string; objective: string; audience: string; angle: string; socialPost: string; longPost: string;
  emailSubject: string; emailBody: string; whatsapp: string; videoScript: string; callToAction: string;
  channels: string[]; metrics: string[];
};
type RequestBody = { messages?: ChatMessage[]; context?: unknown };

type GeminiPayload = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

function textFromGemini(payload: GeminiPayload) {
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text ?? "").join("\n").trim() ?? "";
}

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
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
  if (!/(crea|crear|agenda|agendar|programa|programar|añade|agrega)/.test(normalized)) return null;
  if (!/(tarea|seguimiento|recordatorio|contactar|llamar|responder)/.test(normalized)) return null;
  const title = prompt
    .replace(/^(futura[,\s]*)?/i, "")
    .replace(/\b(crea|crear|agenda|agendar|programa|programar|añade|agrega|una|un|la|el|tarea|recordatorio|hoy|mañana|para hoy|para mañana)\b/gi, "")
    .replace(/\s+/g, " ").trim();
  return { type: "create_task", title: title || "Seguimiento comercial", dueAt: dateFromPrompt(prompt), priority: /urgente|alta prioridad/.test(normalized) ? "Alta" : "Media" };
}

function wantsCampaign(text: string) {
  const n = text.toLowerCase();
  return /(crea|crear|genera|generar|diseña|diseñar|prepara|preparar)/.test(n) && /(campaña|contenido|anuncio|publicación|publicaciones|correo|email|video|reel|redes)/.test(n);
}

function needsResearch(text: string) {
  return ["mercado", "competencia", "tendencia", "investiga", "investigar", "buscar leads", "buscar clientes", "prospectar", "prospectos", "oportunidades", "compradores", "inversionistas"].some((term) => text.toLowerCase().includes(term));
}

async function propertySnapshot() {
  const token = process.env.AIRTABLE_API_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
  if (!token) return [];
  try {
    const response = await fetch(`https://api.airtable.com/v0/${base}/tblZifOElWQtGaXHM?pageSize=50`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json() as { records?: Array<{ id: string; fields?: Record<string, unknown> }> };
    const allowed = /(nombre|t[ií]tulo|c[oó]digo|precio|ubicaci[oó]n|zona|direcci[oó]n|habitaciones|baños|terreno|construcci[oó]n|estado comercial|estado|descripci[oó]n|amenidades|video|recorrido|drive|comisi[oó]n)/i;
    return (payload.records ?? []).map((record) => ({
      id: record.id,
      ...Object.fromEntries(Object.entries(record.fields ?? {}).filter(([key]) => allowed.test(key))),
    })).slice(0, 50);
  } catch {
    return [];
  }
}

function parseCampaign(text: string): { answer: string; campaign?: Campaign } {
  try {
    const parsed = JSON.parse(cleanJson(text)) as { answer?: string; campaign?: Campaign };
    return { answer: parsed.answer?.trim() || "Campaña lista para revisión.", campaign: parsed.campaign };
  } catch { return { answer: text.trim() }; }
}

function parseResearch(text: string): { answer: string; prospects: Prospect[] } {
  try {
    const parsed = JSON.parse(cleanJson(text)) as { answer?: string; prospects?: Prospect[] };
    return { answer: parsed.answer?.trim() || "Investigación completada.", prospects: Array.isArray(parsed.prospects) ? parsed.prospects.slice(0, 8) : [] };
  } catch { return { answer: text.trim(), prospects: [] }; }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const messages = (body.messages ?? []).slice(-16);
    if (!messages.length || messages[messages.length - 1]?.role !== "user") return NextResponse.json({ error: "Falta una consulta válida." }, { status: 400 });

    const latestPrompt = messages[messages.length - 1].content;
    const pendingAction = taskActionFromPrompt(latestPrompt);
    if (pendingAction) {
      const dateText = pendingAction.dueAt ? ` para ${pendingAction.dueAt}` : "";
      return NextResponse.json({ answer: `Puedo crear la tarea “${pendingAction.title}”${dateText} con prioridad ${pendingAction.priority}. Confirma para registrarla en Airtable.`, pendingAction });
    }

    const [growth, properties] = await Promise.all([getGrowthSnapshot(6), propertySnapshot()]);
    const campaignMode = wantsCampaign(latestPrompt);
    const researchMode = !campaignMode && needsResearch(latestPrompt);

    const modeInstruction = campaignMode
      ? `Devuelve SOLO JSON válido: {"answer":"resumen breve","campaign":{"name":"nombre","objective":"objetivo","audience":"audiencia","angle":"ángulo","socialPost":"texto corto","longPost":"texto largo","emailSubject":"asunto","emailBody":"correo","whatsapp":"mensaje","videoScript":"guion de 30-45 segundos","callToAction":"CTA","channels":["canal"],"metrics":["métrica"]}}. Usa datos reales disponibles y marca claramente cualquier dato faltante.`
      : researchMode
        ? `Devuelve SOLO JSON válido: {"answer":"resumen ejecutivo","prospects":[{"name":"prospecto u organización pública","type":"tipo","sourceUrl":"URL pública exacta","reason":"por qué encaja","channel":"canal sugerido"}]}. Máximo 8. No inventes nombres, contactos ni URLs. Si no puedes verificar, prospects debe ser [].`
        : "Responde conversacionalmente. Primero contesta exactamente lo preguntado; después, sólo si aporta valor, indica la siguiente acción concreta.";

    const systemInstruction = `Eres Futura, Director IA de Futura OS. Actúas como centro operativo de una agencia inmobiliaria digital y otros negocios de Futura. Hablas en español claro, directo y útil.

REGLAS DE PRECISIÓN:
1. Tu fuente de verdad, en este orden, es: mensaje actual del usuario > datos de Airtable > backlog Growth > dashboard > historial de conversación.
2. Si dos fuentes contradicen, usa la más reciente y señala brevemente la discrepancia.
3. Nunca inventes precios, propiedades, clientes, resultados, publicaciones, contactos ni acciones ejecutadas.
4. Si un dato no existe en el contexto, di que no está registrado y pregunta sólo lo indispensable.
5. No respondas como un asistente genérico: relaciona la respuesta con Futura OS, el negocio y los datos disponibles.
6. Distingue entre: ya implementado, disponible pero manual, preparado pero no conectado y pendiente de construir.
7. No digas que contactaste, publicaste, guardaste o ejecutaste algo si no ocurrió.
8. Prioriza soluciones gratuitas o de muy bajo costo.
9. Cuando el usuario pregunte “qué hacemos”, da una acción concreta y priorizada, no teoría.

ARQUITECTURA CONOCIDA: Futura OS usa Next.js/React, Vercel y Airtable. El sistema incluye Director IA, Growth AI, CRM, equipo de ventas, contenido, captación, seguimiento y dashboard. Google Drive se usa como repositorio de archivos. Gemini es el motor principal actual.

DATOS ACTUALES DEL DASHBOARD: ${JSON.stringify(body.context ?? {})}
BACKLOG GROWTH: ${JSON.stringify(growth)}
PROPIEDADES REGISTRADAS (campos comerciales permitidos): ${JSON.stringify(properties)}

${modeInstruction}`;

    const contents = messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const requestBody: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { maxOutputTokens: campaignMode ? 2200 : researchMode ? 1600 : 1200, temperature: campaignMode ? 0.45 : 0.18 },
    };
    if (researchMode) requestBody.tools = [{ google_search: {} }];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(requestBody),
    });

    const payload = await response.json() as GeminiPayload & { error?: unknown };
    if (!response.ok) {
      console.error("Gemini respondió con error", payload);
      return NextResponse.json({ error: "Futura no pudo responder con Gemini en este momento." }, { status: 502 });
    }

    const raw = textFromGemini(payload);
    if (!raw) return NextResponse.json({ error: "Gemini devolvió una respuesta vacía." }, { status: 502 });
    if (campaignMode) {
      const result = parseCampaign(raw);
      return NextResponse.json({ answer: result.answer, campaign: result.campaign, mode: "campaign", provider: "gemini" });
    }
    if (researchMode) {
      const result = parseResearch(raw);
      return NextResponse.json({ answer: result.answer, prospects: result.prospects, mode: "research", provider: "gemini" });
    }
    return NextResponse.json({ answer: raw, mode: "operations", provider: "gemini", growthTop: growth[0] ?? null });
  } catch (error) {
    console.error("Error en Director IA con Gemini", error);
    return NextResponse.json({ error: "No se pudo procesar la consulta." }, { status: 500 });
  }
}
