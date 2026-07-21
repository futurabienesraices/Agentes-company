import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    image: { provider: "OpenAI Images", ready: Boolean(process.env.OPENAI_API_KEY) },
    voice: { provider: "ElevenLabs", ready: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) },
    video: { provider: "Adobe Firefly", ready: Boolean(process.env.ADOBE_FIREFLY_CLIENT_ID && process.env.ADOBE_FIREFLY_CLIENT_SECRET), note: "La generación de video se habilita al configurar las credenciales de Adobe Firefly." },
  });
}
