import { NextResponse } from "next/server";
import {
  getMetaAccounts,
  getInstagramRecentPosts,
  publishToInstagram,
  publishToFacebookPage,
} from "../../../../lib/meta-api";
import { verifyMetaChallenge, verifyMetaSignature } from "../../../../lib/webhook-security";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");

  // Meta Webhook Verification challenge
  if (mode === "subscribe") {
    return verifyMetaChallenge(req);
  }

  // Dashboard API fetching accounts & posts
  try {
    const accounts = await getMetaAccounts();
    const igPostsResult = await getInstagramRecentPosts().catch((e: unknown) => {
      console.warn("No se pudieron cargar posts de Instagram:", e);
      return null;
    });

    return NextResponse.json({
      success: true,
      accounts,
      instagram: igPostsResult,
    });
  } catch (error) {
    console.error("Error en GET /api/meta/posts:", error);
    return NextResponse.json(
      {
        error: "Error al conectar con la API de Meta Graph.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256");

  // If this POST comes from Meta Webhook, verify HMAC SHA-256 signature
  if (signatureHeader || process.env.META_APP_SECRET) {
    const securityCheck = verifyMetaSignature(rawBody, req);
    if (!securityCheck.valid) {
      return securityCheck.response;
    }
  }

  try {
    const body = JSON.parse(rawBody);
    const { target, igAccountId, pageId, pageAccessToken, imageUrl, caption, message, link } = body;

    if (target === "instagram") {
      if (!igAccountId || !imageUrl || !caption) {
        return NextResponse.json(
          { error: "Se requieren 'igAccountId', 'imageUrl' y 'caption' para publicar en Instagram." },
          { status: 400 }
        );
      }
      const res = await publishToInstagram(igAccountId, imageUrl, caption);
      return NextResponse.json({ success: true, published: res });
    }

    if (target === "facebook") {
      if (!pageId || !pageAccessToken || !message) {
        return NextResponse.json(
          { error: "Se requieren 'pageId', 'pageAccessToken' y 'message' para publicar en Facebook." },
          { status: 400 }
        );
      }
      const res = await publishToFacebookPage(pageId, pageAccessToken, message, link);
      return NextResponse.json({ success: true, published: res });
    }

    // Webhook update from Meta (e.g. page messages / comments)
    if (body.object) {
      return NextResponse.json({ status: "EVENT_RECEIVED" });
    }

    return NextResponse.json({ error: "Target no válido ('instagram' o 'facebook')." }, { status: 400 });
  } catch (error) {
    console.error("Error en POST /api/meta/posts:", error);
    return NextResponse.json(
      {
        error: "Fallo al procesar petición en Meta.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
