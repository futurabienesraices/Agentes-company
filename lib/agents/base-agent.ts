/**
 * Base Agent — Futura OS
 * Foundation class for all AI agents.
 * Each agent has a defined role, allowed tools, and budget limits.
 */

import { type AIProvider, type AIResult, getDefaultProvider, parseJsonSafe } from "../ai-provider";
import { recordAiUsage } from "../ai-usage";

export type AgentAction = "automatic" | "assisted" | "human";

export type AgentConfig = {
  name: string;
  role: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
  allowedTables?: string[];
  actionLevel?: AgentAction;
};

export type AgentResponse<T = Record<string, unknown>> = {
  answer: string;
  data?: T;
  agent: string;
  usage?: AIResult["usage"];
};

export class BaseAgent {
  protected config: AgentConfig;
  protected provider: AIProvider;

  constructor(config: AgentConfig, provider?: AIProvider) {
    this.config = config;
    this.provider = provider || getDefaultProvider();
  }

  get name() { return this.config.name; }
  get role() { return this.config.role; }

  async execute(
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    const result = await this.provider.generate({
      systemPrompt,
      messages: [{ role: "user", content: prompt }],
      maxTokens: this.config.maxTokens ?? 1200,
      temperature: this.config.temperature ?? 0.2,
      responseFormat: "json",
    });

    // Log usage
    await recordAiUsage({
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        candidatesTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
      model: result.model,
      task: `${this.config.name}: ${prompt.slice(0, 50)}`,
    }).catch(() => {});

    const parsed = parseJsonSafe<{ answer?: string } & Record<string, unknown>>(result.text);

    return {
      answer: parsed?.answer ?? result.text.trim(),
      data: parsed ?? undefined,
      agent: this.config.name,
      usage: result.usage,
    };
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    context?: Record<string, unknown>
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    const result = await this.provider.generate({
      systemPrompt,
      messages,
      maxTokens: this.config.maxTokens ?? 1200,
      temperature: this.config.temperature ?? 0.2,
    });

    await recordAiUsage({
      usage: result.usage ? {
        promptTokens: result.usage.promptTokens,
        candidatesTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
      model: result.model,
      task: `${this.config.name}: chat`,
    }).catch(() => {});

    const parsed = parseJsonSafe<{ answer?: string } & Record<string, unknown>>(result.text);

    return {
      answer: parsed?.answer ?? result.text.trim(),
      data: parsed ?? undefined,
      agent: this.config.name,
      usage: result.usage,
    };
  }

  protected buildSystemPrompt(context?: Record<string, unknown>): string {
    const parts = [this.config.systemPrompt];

    if (context && Object.keys(context).length > 0) {
      parts.push(`\nCONTEXTO ACTUAL:\n${JSON.stringify(context)}`);
    }

    parts.push(`\nRESPONDE SIEMPRE EN JSON: {"answer": "respuesta clara y accionable", ...datos_adicionales}`);

    return parts.join("\n");
  }
}
