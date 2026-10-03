/**
 * Cloudinary API routes — Futura OS
 * GET  → list assets in a folder
 * POST → upload base64 image/video or sign params
 */

import { NextResponse } from "next/server";
import { listAssets, getSignedUploadParams, FOLDERS, uploadFromUrl, uploadBase64 } from "../../../../lib/cloudinary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || FOLDERS.properties;
  try {
    const assets = await listAssets(folder, 50);
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, folder, tags, url, base64 } = body;

    if (action === "sign") {
      const params = getSignedUploadParams(folder || FOLDERS.properties, tags || []);
      return NextResponse.json(params);
    }

    if ((action === "upload_base64" || action === "upload_url") && (base64 || url)) {
      const payload = base64 || url;
      const asset = payload.startsWith("data:")
        ? await uploadBase64(payload, folder || FOLDERS.properties, tags || [])
        : await uploadFromUrl(payload, folder || FOLDERS.properties, tags || []);
      return NextResponse.json({ asset });
    }

    return NextResponse.json({ error: "Acción no reconocida o datos faltantes" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
