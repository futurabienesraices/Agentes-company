"use client";

import { FormEvent, useState } from "react";

export default function PropertyForm() {
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible guardar la propiedad.");
      setStatus(result.missing?.length ? `Propiedad creada. Falta completar: ${result.missing.join(", ")}.` : "Propiedad creada y lista para revisión.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No fue posible guardar la propiedad.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="agentForm" onSubmit={submit}>
      <label>Nombre comercial<input name="name" required placeholder="Casa moderna en el centro" /></label>
      <label>Código<input name="code" required placeholder="FBR-001" /></label>
      <div className="formRow">
        <label>Operación<select name="operation" required defaultValue=""><option value="" disabled>Selecciona</option><option>Venta</option><option>Renta</option></select></label>
        <label>Tipo<select name="propertyType" required defaultValue=""><option value="" disabled>Selecciona</option><option>Casa</option><option>Departamento</option><option>Terreno</option><option>Local</option><option>Oficina</option></select></label>
      </div>
      <div className="formRow">
        <label>Precio<input name="price" type="number" min="1" required placeholder="2500000" /></label>
        <label>Área m²<input name="area" type="number" min="1" placeholder="180" /></label>
      </div>
      <button className="primaryButton" type="submit" disabled={saving}>{saving ? "Guardando…" : "Crear propiedad"}</button>
      {status ? <p className="formStatus">{status}</p> : null}
    </form>
  );
}
