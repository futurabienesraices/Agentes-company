"use client";

import { useState } from "react";

export default function CommercialAction({ matchName }: { matchName: string }) {
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function createTask() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Contactar por coincidencia: ${matchName}`, priority: "Alta" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible crear la tarea.");
      setStatus("Tarea creada en Airtable.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No fue posible crear la tarea.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="inlineAction"><button type="button" onClick={createTask} disabled={saving}>{saving ? "Creando…" : "Crear seguimiento"}</button>{status ? <small>{status}</small> : null}</div>;
}
