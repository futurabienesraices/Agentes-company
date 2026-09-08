/**
 * Cloudinary API routes — Futura OS
 * GET  → list assets in a folder
 * POST → sign params for direct browser upload
 */

import { NextResponse } from "next/server";
import { listAssets, getSignedUploadParams, FOLDERS, uploadFromUrl } from "../../../../lib/cloudinary";

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
    const { action, folder, tags, url } = body;

    if (action === "sign") {
      // Return signed params for direct browser upload widget
      const params = getSignedUploadParams(folder || FOLDERS.properties, tags || []);
      return NextResponse.json(params);
    }

    if (action === "upload_url" && url) {
      // Upload from external URL (e.g. Telegram photo)
      const asset = await uploadFromUrl(url, folder || FOLDERS.properties, tags || []);
      return NextResponse.json({ asset });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
