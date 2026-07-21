"use client";

import { FormEvent, useState } from "react";

export default function LeadCaptureForm() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.financing = form.get("financing") === "on" ? "true" : "";

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, financing: form.get("financing") === "on" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible enviar tu solicitud.");
      setSent(true);
      setStatus(result.message || "Solicitud recibida.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <div className="captureSuccess"><span>✓</span><h2>Solicitud recibida</h2><p>{status}</p><button type="button" className="primaryButton" onClick={() => { setSent(false); setStatus(""); }}>Enviar otra solicitud</button></div>;
  }

  return (
    <form className="agentForm captureForm" onSubmit={submit}>
      <div className="formRow">
        <label>Nombre completo<input name="name" required autoComplete="name" placeholder="Tu nombre" /></label>
        <label>Teléfono<input name="phone" type="tel" autoComplete="tel" placeholder="WhatsApp o llamada" /></label>
      </div>
      <label>Correo<input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" /></label>
      <div className="formRow">
        <label>¿Qué deseas hacer?<select name="operation" defaultValue="Compra"><option>Compra</option><option>Alquiler</option><option>Venta</option></select></label>
        <label>Tipo de propiedad<select name="propertyType" defaultValue="Casa"><option>Casa</option><option>Apartamento</option><option>Terreno</option><option>Local comercial</option><option>Oficina</option><option>Bodega</option><option>Otro</option></select></label>
      </div>
      <div className="formRow">
        <label>Zona o ubicación<input name="location" placeholder="Municipio, colonia o sector" /></label>
        <label>Presupuesto máximo<input name="budget" type="number" min="0" step="1000" inputMode="numeric" placeholder="Monto aproximado" /></label>
      </div>
      <label className="checkboxLabel"><input name="financing" type="checkbox" /> Necesito financiamiento</label>
      <label>Cuéntanos qué necesitas<textarea name="message" rows={4} placeholder="Habitaciones, área, parqueo, fecha prevista y requisitos importantes" /></label>
      <label className="honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="primaryButton" type="submit" disabled={loading}>{loading ? "Enviando…" : "Quiero que me contacten"}</button>
      {status ? <p className="formStatus formError">{status}</p> : null}
      <small className="privacyNote">Usaremos tus datos únicamente para atender tu solicitud inmobiliaria.</small>
    </form>
  );
}
