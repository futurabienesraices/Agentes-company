/**
 * Memory Service — Futura OS
 * Persistent memory for Sov and Agents to learn user preferences and rules.
 */

import { TABLES, listAll, createRecord, text } from "./airtable-client";

export type AgentMemoryItem = {
  category: "preference" | "rule" | "directive" | "learning";
  key: string;
  value: string;
  addedAt: string;
};

// In-memory fallback cache in case Airtable table is pending creation
const localMemoryStore: AgentMemoryItem[] = [
  {
    category: "directive",
    key: "Orquestador Principal",
    value: "El usuario Ever se dirige al Orquestador como 'Sov' o 'Mi Sov'. Sov debe responder con tono profesional, ejecutivo y proactivo.",
    addedAt: new Date().toISOString(),
  },
  {
    category: "preference",
    key: "Marca e Identidad",
    value: "Empresa: Futura Bienes Raíces. Enfoque: Propiedades residenciales y comerciales de alto valor.",
    addedAt: new Date().toISOString(),
  }
];

export async function getSystemMemory(): Promise<AgentMemoryItem[]> {
  try {
    // Attempt to read from Airtable if table exists
    const records = await listAll((TABLES as any).memoriaProspectos || "Memoria System");
    if (records && records.length > 0) {
      const dbMemories = records.map((r) => ({
        category: (text(r.fields, "Categoria") || "learning") as AgentMemoryItem["category"],
        key: text(r.fields, "Clave") || text(r.fields, "Evento") || "Memoria",
        value: text(r.fields, "Valor") || text(r.fields, "Evidencia") || "",
        addedAt: text(r.fields, "Fecha") || new Date().toISOString(),
      })).filter((m) => m.value.length > 0);

      return [...localMemoryStore, ...dbMemories];
    }
  } catch (error) {
    console.warn("Airtable memory table fallback to local store:", error);
  }

  return localMemoryStore;
}

export async function saveUserDirective(key: string, value: string, category: AgentMemoryItem["category"] = "rule"): Promise<void> {
  const newItem: AgentMemoryItem = {
    category,
    key,
    value,
    addedAt: new Date().toISOString(),
  };

  localMemoryStore.push(newItem);

  try {
    await createRecord((TABLES as any).memoriaProspectos || "Memoria System", {
      Evento: `Regla Sov: ${key}`,
      Evidencia: value,
      Categoria: category,
      Fecha: newItem.addedAt,
    });
  } catch (error) {
    console.warn("Could not persist memory to Airtable, saved in runtime memory:", error);
  }
}

export async function buildMemoryPromptContext(): Promise<string> {
  const memories = await getSystemMemory();
  if (memories.length === 0) return "";

  const lines = memories.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
  return `\nMEMORIA Y PREFERENCIAS GUARDADAS DE EVER (DUEÑO):\n${lines.join("\n")}\n`;
}
