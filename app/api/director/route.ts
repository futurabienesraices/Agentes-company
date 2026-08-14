import { NextResponse } from "next/server";
import { getGrowthSnapshot } from "../../../lib/growth";

type ChatMessage = { role: "user" | "assistant"; content: string };
type RequestBody = { messages?: ChatMessage[]; context?: unknown };

function textFromGemini(payload: any) {
  return payload?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? "").join("\n").trim() ?? "";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const messages = (body.messages ?? []).slice(-12);
    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Falta una consulta válida." }, { status: 400 });
    }

    const growth = await getGrowthSnapshot(4);
    const systemInstruction = `Eres Futura, Director IA de Futura OS. Responde siempre en español, breve, clara y orientada a ejecutar. Diriges una agencia inmobiliaria digital y un ecosistema de agentes de IA. Tu equipo incluye Growth AI, Investigación de Mercado, Prospección, Ventas, Contenido, Difusión y Seguimiento. Usa los datos internos disponibles sin inventar cifras. Prioriza acciones de alto retorno y bajo costo. No afirmes que publicaste, contactaste, guardaste o ejecutaste algo si no ocurrió. Para ventas, separa claramente lo que puede hacer la IA y lo que requiere acción humana. Contexto del dashboard: ${JSON.stringify(body.context ?? {})}. Backlog Growth: ${JSON.stringify(growth.slice(0, 4))}.`;

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens: 900, temperature: 0.35 },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("Gemini respondió con error", payload);
      return NextResponse.json({ error: "Futura no pudo responder con Gemini en este momento." }, { status: 502 });
    }

    const answer = textFromGemini(payload);
    if (!answer) return NextResponse.json({ error: "Gemini devolvió una respuesta vacía." }, { status: 502 });
    return NextResponse.json({ answer, mode: "operations", provider: "gemini", growthTop: growth[0] ?? null });
  } catch (error) {
    console.error("Error en Director IA con Gemini", error);
    return NextResponse.json({ error: "No se pudo procesar la consulta." }, { status: 500 });
  }
}
