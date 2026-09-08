/**
 * Video Generator — Futura OS
 * Generates property slideshow videos using FREE tools.
 *
 * Strategy:
 * - Creatomate API (50 free videos/month) for polished output
 * - Server-side HTML-to-video as fallback concept
 * - Returns video config for client-side rendering when needed
 */

export type VideoSlide = {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  duration?: number; // seconds per slide
};

export type VideoRequest = {
  slides: VideoSlide[];
  property: {
    title: string;
    price?: string;
    location?: string;
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  music?: string;
  duration?: number; // total duration in seconds
  format?: "reel" | "story" | "landscape";
  branding?: {
    logo?: string;
    name?: string;
    phone?: string;
    website?: string;
  };
};

export type VideoResult = {
  provider: string;
  status: "ready" | "rendering" | "config_only";
  url?: string;
  config?: VideoConfig;
};

export type VideoConfig = {
  slides: Array<{
    imageUrl: string;
    title: string;
    subtitle: string;
    duration: number;
  }>;
  dimensions: { width: number; height: number };
  totalDuration: number;
  intro: { title: string; subtitle: string };
  outro: { title: string; contact: string };
  transitions: string;
};

// ─── Dimensions ─────────────────────────────────────────────────────

function dimensionsForFormat(format?: string): { width: number; height: number } {
  switch (format) {
    case "reel":
    case "story":
      return { width: 1080, height: 1920 };
    case "landscape":
      return { width: 1920, height: 1080 };
    default:
      return { width: 1080, height: 1920 }; // Default to reel (mobile-first)
  }
}

// ─── Build Video Config ─────────────────────────────────────────────

export function buildVideoConfig(request: VideoRequest): VideoConfig {
  const { property, slides, branding, format } = request;
  const dims = dimensionsForFormat(format);
  const slideDuration = request.duration
    ? Math.max(2, Math.floor(request.duration / (slides.length + 2)))
    : 3;

  const configSlides = slides.map((slide, i) => ({
    imageUrl: slide.imageUrl,
    title: slide.title || (i === 0 ? property.title : ""),
    subtitle: slide.subtitle || "",
    duration: slide.duration || slideDuration,
  }));

  const priceText = property.price ? `$${property.price}` : "";
  const details = [
    property.bedrooms ? `${property.bedrooms} hab` : "",
    property.bathrooms ? `${property.bathrooms} baños` : "",
    property.area ? `${property.area}m²` : "",
  ].filter(Boolean).join(" · ");

  return {
    slides: configSlides,
    dimensions: dims,
    totalDuration: configSlides.reduce((sum, s) => sum + s.duration, 0) + 6, // +intro+outro
    intro: {
      title: property.title,
      subtitle: [priceText, property.location, details].filter(Boolean).join(" · "),
    },
    outro: {
      title: branding?.name || "Futura Bienes Raíces",
      contact: branding?.phone || branding?.website || "",
    },
    transitions: "fade",
  };
}

// ─── Creatomate API (50 free/month) ─────────────────────────────────

export async function generateCreatomateVideo(request: VideoRequest): Promise<VideoResult> {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) throw new Error("CREATOMATE_API_KEY no configurada.");

  const config = buildVideoConfig(request);

  // Build Creatomate render request
  const elements = [];

  // Intro slide
  elements.push({
    type: "composition",
    track: 1,
    duration: 3,
    elements: [
      {
        type: "shape",
        shape: "rectangle",
        fill_color: "rgba(0,0,0,0.7)",
        width: "100%",
        height: "100%",
      },
      {
        type: "text",
        text: config.intro.title,
        font_family: "Inter",
        font_weight: 700,
        font_size: "8 vmin",
        fill_color: "#ffffff",
        y: "40%",
        x_alignment: "50%",
        y_alignment: "50%",
      },
      {
        type: "text",
        text: config.intro.subtitle,
        font_family: "Inter",
        font_weight: 400,
        font_size: "4 vmin",
        fill_color: "#e0e0e0",
        y: "55%",
        x_alignment: "50%",
        y_alignment: "50%",
      },
    ],
  });

  // Photo slides
  for (const slide of config.slides) {
    const slideElements: Record<string, unknown>[] = [
      { type: "image", source: slide.imageUrl, fit: "cover", width: "100%", height: "100%" },
    ];
    if (slide.title) {
      slideElements.push({
        type: "text",
        text: slide.title,
        font_family: "Inter",
        font_weight: 600,
        font_size: "5 vmin",
        fill_color: "#ffffff",
        background_color: "rgba(0,0,0,0.5)",
        y: "85%",
        x_alignment: "50%",
        y_alignment: "50%",
      });
    }
    elements.push({
      type: "composition",
      track: 1,
      duration: slide.duration,
      elements: slideElements,
    });
  }

  // Outro
  elements.push({
    type: "composition",
    track: 1,
    duration: 3,
    elements: [
      {
        type: "shape",
        shape: "rectangle",
        fill_color: "#1a1a2e",
        width: "100%",
        height: "100%",
      },
      {
        type: "text",
        text: config.outro.title,
        font_family: "Inter",
        font_weight: 700,
        font_size: "7 vmin",
        fill_color: "#ffffff",
        y: "45%",
        x_alignment: "50%",
        y_alignment: "50%",
      },
      {
        type: "text",
        text: config.outro.contact,
        font_family: "Inter",
        font_weight: 400,
        font_size: "4 vmin",
        fill_color: "#b0b0b0",
        y: "58%",
        x_alignment: "50%",
        y_alignment: "50%",
      },
    ],
  });

  const response = await fetch("https://api.creatomate.com/v1/renders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        width: config.dimensions.width,
        height: config.dimensions.height,
        elements,
      },
    ]),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Creatomate respondió ${response.status}: ${error.slice(0, 200)}`);
  }

  const renders = (await response.json()) as Array<{ id: string; url?: string; status?: string }>;
  const render = renders[0];

  return {
    provider: "creatomate",
    status: render.url ? "ready" : "rendering",
    url: render.url,
  };
}

// ─── Client-side config (always works, no API needed) ───────────────

export function generateVideoConfig(request: VideoRequest): VideoResult {
  const config = buildVideoConfig(request);
  return {
    provider: "client",
    status: "config_only",
    config,
  };
}

// ─── Main generator ─────────────────────────────────────────────────

export async function generateVideo(request: VideoRequest): Promise<VideoResult> {
  // Try Creatomate first (higher quality, but limited)
  if (process.env.CREATOMATE_API_KEY) {
    try {
      return await generateCreatomateVideo(request);
    } catch (error) {
      console.warn("Creatomate falló, usando config local:", error);
    }
  }

  // Fallback: return config for client-side rendering
  return generateVideoConfig(request);
}
