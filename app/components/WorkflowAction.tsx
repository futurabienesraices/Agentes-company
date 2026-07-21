"use client";

import { useState } from "react";

type Props = {
  title: string;
  action: string;
  priority?: "Alta" | "Media" | "Baja";
  dueAt?: string;
};

export default function WorkflowAction({ title, action, priority = "Alta", dueAt }: Props) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTask() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${action}: ${title}`,
          priority,
          dueAt: dueAt || new Date().toISOString().slice(0, 10),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible crear la tarea.");
      setStatus("Tarea creada");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return <div className="inlineAction"><button type="button" disabled={loading} onClick={createTask}>{loading ? "Creando…" : action}</button>{status ? <small>{status}</small> : null}</div>;
}
