import { NextResponse } from "next/server";

type RequestBody = { text?: string; voiceId?: string };

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const defaultVoice = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY no está configurada." }, { status: 503 });

  try {
    const body = (await request.json()) as RequestBody;
    const text = body.text?.trim();
    const voiceId = body.voiceId?.trim() || defaultVoice;
    if (!text) return NextResponse.json({ error: "Escribe el texto que quieres narrar." }, { status: 400 });
    if (!voiceId) return NextResponse.json({ error: "Falta ELEVENLABS_VOICE_ID." }, { status: 503 });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2", output_format: "mp3_44100_128" }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("ElevenLabs respondió con error", detail);
      return NextResponse.json({ error: "No se pudo generar la narración." }, { status: 502 });
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${bytes.toString("base64")}` });
  } catch (error) {
    console.error("Error generando narración", error);
    return NextResponse.json({ error: "No se pudo procesar la narración." }, { status: 500 });
  }
}
