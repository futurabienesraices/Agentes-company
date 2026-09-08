/**
 * Cloudinary Client — Futura OS
 * Manages photo/video uploads for all business lines.
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryAsset = {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  resource_type: "image" | "video" | "raw";
  bytes: number;
  width?: number;
  height?: number;
  folder: string;
  created_at: string;
  tags: string[];
};

// ─── Business line folders ────────────────────────────────────────────
// futura/bienes-raices → property photos & videos
// futura/limpieza      → cleaning service
// futura/apps          → digital products / apps

export const FOLDERS = {
  properties: "futura/bienes-raices",
  cleaning: "futura/limpieza",
  apps: "futura/apps",
  general: "futura/general",
};

// ─── Upload a file from a URL (e.g. from Telegram) ───────────────────

export async function uploadFromUrl(
  url: string,
  folder: string = FOLDERS.properties,
  tags: string[] = []
): Promise<CloudinaryAsset> {
  const result = await cloudinary.uploader.upload(url, {
    folder,
    tags,
    resource_type: "auto",
  });
  return result as unknown as CloudinaryAsset;
}

// ─── Upload a base64 or buffer ────────────────────────────────────────

export async function uploadBase64(
  base64: string,
  folder: string = FOLDERS.properties,
  tags: string[] = []
): Promise<CloudinaryAsset> {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    tags,
    resource_type: "auto",
  });
  return result as unknown as CloudinaryAsset;
}

// ─── List assets in a folder ──────────────────────────────────────────

export async function listAssets(
  folder: string = FOLDERS.properties,
  maxResults: number = 30
): Promise<CloudinaryAsset[]> {
  const result = await cloudinary.search
    .expression(`folder:${folder}`)
    .sort_by("created_at", "desc")
    .max_results(maxResults)
    .execute();

  return (result.resources || []) as CloudinaryAsset[];
}

// ─── Get a signed upload URL for direct browser upload ───────────────

export function getSignedUploadParams(
  folder: string = FOLDERS.properties,
  tags: string[] = []
): { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string; tags: string } {
  const timestamp = Math.round(Date.now() / 1000);
  const tagStr = tags.join(",");
  const params: Record<string, string | number> = { folder, timestamp };
  if (tagStr) params.tags = tagStr;

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    tags: tagStr,
  };
}

// ─── Delete an asset ──────────────────────────────────────────────────

export async function deleteAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
