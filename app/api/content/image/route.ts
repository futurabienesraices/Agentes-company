import { NextResponse } from "next/server";

type RequestBody = { prompt?: string; size?: "1024x1024" | "1536x1024" | "1024x1536" };

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const prompt = body.prompt?.trim();
    if (!prompt) return NextResponse.json({ error: "Describe la imagen que quieres crear." }, { status: 400 });

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt,
        size: body.size ?? "1024x1024",
        quality: "medium",
        output_format: "png",
      }),
    });

    const payload = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string }>; error?: { message?: string } };
    if (!response.ok) {
      console.error("OpenAI Images respondió con error", payload);
      return NextResponse.json({ error: payload.error?.message ?? "No se pudo generar la imagen." }, { status: 502 });
    }

    const result = payload.data?.[0];
    if (!result) return NextResponse.json({ error: "La generación no devolvió una imagen." }, { status: 502 });
    const imageUrl = result.b64_json ? `data:image/png;base64,${result.b64_json}` : result.url;
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generando imagen", error);
    return NextResponse.json({ error: "No se pudo procesar la generación." }, { status: 500 });
  }
}
