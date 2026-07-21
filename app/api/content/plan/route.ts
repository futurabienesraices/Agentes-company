import { NextResponse } from "next/server";

type RequestBody = {
  property?: {
    name?: string;
    location?: string;
    price?: string;
    details?: string;
    status?: "new" | "active" | "low" | "old" | "paused";
    previousContent?: string;
  };
};

type ContentPiece = { format: string; channel: string; title: string; body: string; cta: string };
type EditorialPlan = {
  classification: string;
  objective: string;
  angle: string;
  recommendation: string;
  cadence: string;
  carousel: { slide: number; title: string; copy: string }[];
  pieces: ContentPiece[];
  metrics: string[];
};

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (response.output_text) return response.output_text;
  return response.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text).join("\n") ?? "";
}

function parsePlan(text: string): EditorialPlan | null {
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as EditorialPlan;
    if (!parsed.angle || !Array.isArray(parsed.carousel) || !Array.isArray(parsed.pieces)) return null;
    return parsed;
  } catch { return null; }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const property = body.property;
    if (!property?.name?.trim()) return NextResponse.json({ error: "Indica el nombre de la propiedad." }, { status: 400 });

    const prompt = `Crea un plan editorial inmobiliario original en español para esta propiedad:\n${JSON.stringify(property)}\n\nReglas:\n- Si es nueva, crea lanzamiento.\n- Si ya fue publicada, NO repitas el mismo enfoque: elige un ángulo nuevo basado en familia, inversión, zona, presupuesto, estilo de vida, comparación o detalles poco vistos.\n- No inventes características, descuentos, escasez ni cambios de precio.\n- Recomienda primero carrusel, historias y publicación estática. El video sólo será un reel sencillo con fotos reales, texto y narración.\n- Devuelve exclusivamente JSON válido con esta forma exacta:\n{"classification":"Nueva | Activa con buen rendimiento | Activa con poca interacción | Antigua para relanzamiento | Pausada","objective":"...","angle":"...","recommendation":"...","cadence":"...","carousel":[{"slide":1,"title":"...","copy":"..."}],"pieces":[{"format":"Historia | Instagram | Facebook | WhatsApp | Email | Reel","channel":"...","title":"...","body":"...","cta":"..."}],"metrics":["..."]}\nIncluye exactamente 7 diapositivas y entre 4 y 6 piezas. Los textos deben ser utilizables, claros y breves.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-5-mini", input: [{ role: "developer", content: "Eres el Director Editorial de Futura OS. Diseñas campañas inmobiliarias honestas, medibles y no repetitivas." }, { role: "user", content: prompt }], max_output_tokens: 1800, store: false }),
    });

    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: "No se pudo generar el plan editorial." }, { status: 502 });
    const plan = parsePlan(extractOutputText(payload));
    if (!plan) return NextResponse.json({ error: "La IA devolvió un plan incompleto. Intenta de nuevo." }, { status: 502 });
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error creando plan editorial", error);
    return NextResponse.json({ error: "No se pudo procesar la propiedad." }, { status: 500 });
  }
}
