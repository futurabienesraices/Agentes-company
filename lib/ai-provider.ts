/**
 * AI Provider — Futura OS
 * Unified interface for AI providers (Gemini, OpenAI).
 * Each call is logged with provider, model, tokens, and cost.
 */

export type AIRequest = {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
  tools?: Record<string, unknown>[];
};

export type AIResult = {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export interface AIProvider {
  name: string;
  generate(request: AIRequest): Promise<AIResult>;
}

// ─── Gemini Provider ─────────────────────────────────────────────────

type GeminiPayload = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  error?: unknown;
};

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";
    this.model = model || process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIRequest): Promise<AIResult> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY no configurada.");

    const contents = request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      system_instruction: { parts: [{ text: request.systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 1200,
        temperature: request.temperature ?? 0.18,
      },
    };

    if (request.tools?.length) {
      body.tools = request.tools;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify(body),
      }
    );

    const payload = (await response.json()) as GeminiPayload;
    if (!response.ok) {
      const errDetail = JSON.stringify((payload as any).error ?? payload).slice(0, 200);
      console.error("Gemini error", errDetail);
      throw new Error(`Gemini error ${response.status}: ${errDetail}`);
    }

    const text =
      payload.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("\n").trim() ?? "";
    if (!text) throw new Error("Gemini devolvió una respuesta vacía.");

    const usage = payload.usageMetadata;
    return {
      text,
      provider: "gemini",
      model: this.model,
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount,
            completionTokens: usage.candidatesTokenCount,
            totalTokens: usage.totalTokenCount,
          }
        : undefined,
    };
  }
}

// ─── OpenAI Provider ─────────────────────────────────────────────────

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model || process.env.OPENAI_MODEL || "gpt-5-mini";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIRequest): Promise<AIResult> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY no configurada.");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: "developer", content: request.systemPrompt },
          ...request.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_output_tokens: request.maxTokens ?? 1200,
        store: false,
      }),
    });

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw new Error("OpenAI no pudo responder.");

    // Handle Responses API output format
    let text = "";
    if (typeof payload.output_text === "string") {
      text = payload.output_text;
    } else if (Array.isArray(payload.output)) {
      text = (payload.output as Array<{ content?: Array<{ type?: string; text?: string }> }>)
        .flatMap((item) => item.content ?? [])
        .filter((item) => item.type === "output_text" && typeof item.text === "string")
        .map((item) => item.text!)
        .join("\n");
    }

    return {
      text: text.trim(),
      provider: "openai",
      model: this.model,
      usage: undefined, // Responses API has different usage format
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

let defaultProvider: AIProvider | null = null;

export function getDefaultProvider(): AIProvider {
  if (defaultProvider) return defaultProvider;

  const gemini = new GeminiProvider();
  if (gemini.isConfigured()) {
    defaultProvider = gemini;
    return gemini;
  }

  const openai = new OpenAIProvider();
  if (openai.isConfigured()) {
    defaultProvider = openai;
    return openai;
  }

  // Fallback a Gemini no configurado para evitar que falle el build de Next.js
  // Lanzará el error en runtime cuando intente llamar a generate()
  return gemini;
}

// ─── Utilities ──────────────────────────────────────────────────────

export function cleanJson(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export function parseJsonSafe<T>(text: string): T | null {
  try {
    return JSON.parse(cleanJson(text)) as T;
  } catch {
    return null;
  }
}
