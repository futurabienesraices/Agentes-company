/**
 * Image Generator — Futura OS
 * Generates marketing images for properties using FREE providers.
 *
 * Providers (priority order):
 * 1. Pollinations.ai — Unlimited, no API key needed
 * 2. Gemini Imagen — Uses existing GEMINI_API_KEY (free tier)
 */

export type ImageRequest = {
  prompt?: string;
  width?: number;
  height?: number;
  style?: "photo" | "flyer" | "social" | "banner";
  property?: {
    title: string;
    price?: string;
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    type?: string;
  };
};

export type ImageResult = {
  url: string;
  provider: string;
  prompt: string;
  width: number;
  height: number;
};

// ─── Prompt Builder ──────────────────────────────────────────────────

function buildPropertyPrompt(request: ImageRequest): string {
  const { property, style } = request;

  if (request.prompt) return request.prompt;
  if (!property) return "Modern real estate property, professional photography, high quality";

  const parts: string[] = [];

  switch (style) {
    case "flyer":
      parts.push("Professional real estate marketing flyer design");
      parts.push("modern typography, elegant layout, premium feel");
      parts.push(`Property: ${property.title}`);
      if (property.price) parts.push(`Price: ${property.price}`);
      if (property.location) parts.push(`Location: ${property.location}`);
      parts.push("clean white background, gold accents, luxury branding");
      break;

    case "social":
      parts.push("Instagram real estate post design");
      parts.push("square format, vibrant colors, eye-catching");
      parts.push(`${property.type || "Property"}: ${property.title}`);
      if (property.location) parts.push(property.location);
      parts.push("modern minimalist design, professional");
      break;

    case "banner":
      parts.push("Wide banner for real estate website");
      parts.push(`Beautiful ${property.type || "property"}`);
      if (property.location) parts.push(`in ${property.location}`);
      parts.push("panoramic view, professional photography, warm lighting");
      break;

    default:
      parts.push(`Beautiful ${property.type || "property"} exterior and interior`);
      parts.push("professional real estate photography");
      if (property.location) parts.push(`located in ${property.location}`);
      parts.push("high quality, natural lighting, inviting atmosphere");
  }

  return parts.join(", ");
}

function dimensionsForStyle(style?: string): { width: number; height: number } {
  switch (style) {
    case "social":
      return { width: 1080, height: 1080 };
    case "banner":
      return { width: 1200, height: 628 };
    case "flyer":
      return { width: 1080, height: 1350 };
    default:
      return { width: 1024, height: 1024 };
  }
}

// ─── Pollinations.ai (FREE, no key) ─────────────────────────────────

export function generatePollinationsUrl(request: ImageRequest): ImageResult {
  const prompt = buildPropertyPrompt(request);
  const dims = dimensionsForStyle(request.style);
  const width = request.width || dims.width;
  const height = request.height || dims.height;

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`;

  return {
    url,
    provider: "pollinations",
    prompt,
    width,
    height,
  };
}

/** Fetch the image as a buffer (for server-side processing/saving) */
export async function generatePollinationsImage(request: ImageRequest): Promise<{
  buffer: Buffer;
  contentType: string;
  result: ImageResult;
}> {
  const result = generatePollinationsUrl(request);

  const response = await fetch(result.url);
  if (!response.ok) throw new Error(`Pollinations respondió ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return { buffer, contentType, result };
}

// ─── Gemini Imagen (free tier with API key) ──────────────────────────

export async function generateGeminiImage(request: ImageRequest): Promise<ImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada para generación de imágenes.");

  const prompt = buildPropertyPrompt(request);
  const model = "gemini-2.0-flash-preview-image-generation";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini Imagen respondió ${response.status}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { mimeType: string; data: string };
        }>;
      };
    }>;
  };

  const imagePart = payload.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData) {
    throw new Error("Gemini no generó una imagen.");
  }

  // Return as data URL (can be served directly or saved)
  const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  const dims = dimensionsForStyle(request.style);

  return {
    url: dataUrl,
    provider: "gemini-imagen",
    prompt,
    width: request.width || dims.width,
    height: request.height || dims.height,
  };
}

// ─── Main generator (tries providers in order) ──────────────────────

export async function generateImage(request: ImageRequest): Promise<ImageResult> {
  // Strategy: Pollinations for URL-based (instant, free), Gemini for higher quality
  const preferGemini = request.style === "flyer" || request.style === "banner";

  if (preferGemini && process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiImage(request);
    } catch (error) {
      console.warn("Gemini Imagen falló, usando Pollinations:", error);
    }
  }

  // Pollinations always works — no API key needed
  return generatePollinationsUrl(request);
}

// ─── Property-specific generators ───────────────────────────────────

export function generatePropertyFlyer(property: ImageRequest["property"]): ImageResult {
  return generatePollinationsUrl({ style: "flyer", property: property! });
}

export function generatePropertySocialPost(property: ImageRequest["property"]): ImageResult {
  return generatePollinationsUrl({ style: "social", property: property! });
}

export function generatePropertyBanner(property: ImageRequest["property"]): ImageResult {
  return generatePollinationsUrl({ style: "banner", property: property! });
}
