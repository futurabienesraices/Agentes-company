/**
 * Sales Agent — Futura OS
 * Prioritizes daily sales actions and suggests follow-ups.
 */

import { BaseAgent, type AgentResponse } from "./base-agent";
import { TABLES, FIELD, listAll, text, num, select, links, today, daysSince, priorityRank } from "../airtable-client";

export type DailyPriority = {
  type: "lead" | "followup" | "property" | "task";
  title: string;
  action: string;
  priority: "Alta" | "Media" | "Baja";
  reason: string;
};

export type DailySummary = {
  answer: string;
  priorities: DailyPriority[];
  stats: { leads: number; followups: number; properties: number };
};

const SALES_PROMPT = `Eres el Agente de Ventas de Futura Bienes Raíces. Tu trabajo es priorizar las acciones del día.

REGLAS:
1. Ordena las tareas por urgencia real: leads sin responder > seguimientos vencidos > propiedades listas.
2. No inventes leads ni propiedades.
3. Sé concreto: "Llamar a Juan García sobre Casa en Escalón" no "Contactar leads pendientes".
4. Máximo 8 prioridades para no sobrecargar al equipo.
5. Incluye el POR QUÉ de cada prioridad.

Devuelve JSON:
{
  "answer": "Resumen ejecutivo del día en 2 líneas",
  "priorities": [
    {"type": "lead|followup|property|task", "title": "acción concreta", "action": "paso siguiente", "priority": "Alta|Media|Baja", "reason": "por qué ahora"}
  ]
}`;

const salesAgent = new BaseAgent({
  name: "Ventas AI",
  role: "Director comercial y priorización diaria",
  systemPrompt: SALES_PROMPT,
  maxTokens: 1200,
  temperature: 0.15,
  actionLevel: "assisted",
});

// ─── Gather real data for context ───────────────────────────────────

async function gatherSalesContext() {
  const [leads, followUps, properties] = await Promise.all([
    listAll(TABLES.leads),
    listAll(TABLES.followUps),
    listAll(TABLES.properties),
  ]);

  const currentDate = today();

  const pendingLeads = leads
    .filter((r) => ["Pendiente", "Calificando"].includes(text(r.fields, FIELD.leads.response)))
    .map((r) => ({
      name: text(r.fields, FIELD.leads.name) || "Lead sin nombre",
      priority: text(r.fields, FIELD.leads.priority),
      channel: text(r.fields, FIELD.leads.channel),
      enteredAt: text(r.fields, FIELD.leads.enteredAt),
    }))
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
    .slice(0, 10);

  const overdueFollowUps = followUps
    .filter((r) => {
      const dueAt = text(r.fields, FIELD.followUps.dueAt);
      const status = text(r.fields, FIELD.followUps.status);
      return dueAt && dueAt <= currentDate && !["Cerrado", "Completado"].includes(status);
    })
    .map((r) => ({
      name: text(r.fields, FIELD.followUps.name),
      nextAction: text(r.fields, FIELD.followUps.nextAction),
      dueAt: text(r.fields, FIELD.followUps.dueAt),
    }))
    .slice(0, 10);

  const readyProperties = properties
    .filter((r) => {
      const status = select(r.fields, FIELD.properties.commercialStatus);
      return ["Lista para publicar", "Publicada", "Con interesados"].includes(status);
    })
    .map((r) => ({
      code: text(r.fields, FIELD.properties.code),
      title: text(r.fields, FIELD.properties.title),
      status: select(r.fields, FIELD.properties.commercialStatus),
      price: num(r.fields, FIELD.properties.price),
      zone: text(r.fields, FIELD.properties.zone),
    }))
    .slice(0, 10);

  return {
    date: currentDate,
    pendingLeads,
    overdueFollowUps,
    readyProperties,
    stats: {
      leads: pendingLeads.length,
      followups: overdueFollowUps.length,
      properties: readyProperties.length,
    },
  };
}

// ─── Public API ─────────────────────────────────────────────────────

export async function getDailyPriorities(): Promise<DailySummary> {
  const context = await gatherSalesContext();

  const response = await salesAgent.execute(
    `Es ${context.date}. Dame las prioridades de hoy basándote en los datos reales.`,
    context as unknown as Record<string, unknown>
  );

  const data = response.data as { priorities?: DailyPriority[] } | undefined;

  return {
    answer: response.answer,
    priorities: data?.priorities || [],
    stats: context.stats,
  };
}

export async function askSalesAgent(question: string): Promise<AgentResponse> {
  const context = await gatherSalesContext();
  return salesAgent.execute(question, context as unknown as Record<string, unknown>);
}

export { salesAgent };
