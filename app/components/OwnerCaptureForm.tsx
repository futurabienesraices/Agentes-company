"use client";

import { FormEvent, useState } from "react";

type Result = { message?: string; error?: string; reference?: string };

export default function OwnerCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          consent: data.get("consent") === "on",
          legalDocs: data.get("legalDocs") === "on",
          occupied: data.get("occupied") === "on",
        }),
      });
      const result = (await response.json()) as Result;
      if (!response.ok) throw new Error(result.error || "No fue posible registrar la propiedad.");
      setReference(result.reference || "");
      setStatus(result.message || "Recibimos los datos de tu propiedad.");
      setSent(true);
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="ownerSuccess">
        <span>✓</span>
        <h2>Propiedad registrada</h2>
        <p>{status}</p>
        {reference ? <strong>Referencia: {reference}</strong> : null}
        <button type="button" onClick={() => { setSent(false); setStatus(""); setReference(""); }}>Registrar otra</button>
        <style jsx>{`
          .ownerSuccess{text-align:center;padding:34px 12px}.ownerSuccess>span{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 18px;border-radius:50%;background:#eaf8ee;color:#17743a;font-size:2rem}.ownerSuccess h2{margin:0;font-size:1.8rem}.ownerSuccess p{color:#667085;line-height:1.55}.ownerSuccess strong{display:block;margin:15px 0;color:#142033}.ownerSuccess button{border:0;border-radius:12px;background:#0071e3;color:#fff;padding:13px 18px;font-weight:800;cursor:pointer}
        `}</style>
      </div>
    );
  }

  return (
    <form className="ownerForm" onSubmit={submit}>
      <div className="row">
        <label>Nombre completo<input name="name" required autoComplete="name" placeholder="Tu nombre" /></label>
        <label>WhatsApp o teléfono<input name="phone" type="tel" autoComplete="tel" placeholder="Número de contacto" /></label>
      </div>
      <label>Correo<input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" /></label>
      <div className="row">
        <label>¿Qué deseas hacer?<select name="operation" defaultValue="Venta"><option>Venta</option><option>Alquiler</option><option>Venta/Alquiler</option></select></label>
        <label>Tipo de propiedad<select name="propertyType" defaultValue="Casa"><option>Casa</option><option>Apartamento</option><option>Terreno</option><option>Local comercial</option><option>Oficina</option><option>Bodega</option><option>Edificio</option><option>Finca</option></select></label>
      </div>
      <label>Zona o ubicación<input name="location" required placeholder="Colonia, sector o referencia" /></label>
      <div className="row">
        <label>Municipio<input name="municipality" placeholder="Municipio" /></label>
        <label>Departamento<input name="department" placeholder="Departamento" /></label>
      </div>
      <div className="row three">
        <label>Precio esperado<input name="expectedPrice" type="number" min="0" step="1000" inputMode="numeric" placeholder="Aproximado" /></label>
        <label>Área m²<input name="area" type="number" min="0" step="1" inputMode="decimal" /></label>
        <label>Urgencia<select name="urgency" defaultValue="1-3 meses"><option>Esta semana</option><option>Este mes</option><option>1-3 meses</option><option>Sin prisa</option></select></label>
      </div>
      <div className="row three">
        <label>Habitaciones<input name="bedrooms" type="number" min="0" step="1" inputMode="numeric" /></label>
        <label>Baños<input name="bathrooms" type="number" min="0" step="1" inputMode="numeric" /></label>
        <label>Parqueos<input name="parking" type="number" min="0" step="1" inputMode="numeric" /></label>
      </div>
      <div className="checks">
        <label><input name="legalDocs" type="checkbox" /> Tengo documentación disponible</label>
        <label><input name="occupied" type="checkbox" /> La propiedad está ocupada</label>
      </div>
      <label>Detalles importantes<textarea name="message" rows={4} placeholder="Estado, amenidades, acceso, condiciones o cualquier detalle útil" /></label>
      <label className="honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent"><input name="consent" type="checkbox" required /> Autorizo que Futura me contacte para evaluar y comercializar esta propiedad.</label>
      <button className="submit" type="submit" disabled={loading}>{loading ? "Registrando…" : "Solicitar evaluación"}</button>
      {status ? <p className="error">{status}</p> : null}
      <small>El registro es gratuito. No publicaremos la propiedad sin revisar la información y obtener tu aprobación.</small>

      <style jsx>{`
        .ownerForm{display:grid;gap:15px}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.row.three{grid-template-columns:repeat(3,1fr)}label{display:grid;gap:7px;color:#344054;font-size:.78rem;font-weight:760}input,select,textarea{width:100%;min-height:48px;border:1px solid #d0d5dd;border-radius:12px;background:#fff;padding:12px 13px;color:#101828;outline:none}textarea{resize:vertical}input:focus,select:focus,textarea:focus{border-color:#0071e3;box-shadow:0 0 0 3px rgba(0,113,227,.12)}.checks{display:flex;gap:18px;flex-wrap:wrap}.checks label,.consent{display:flex;align-items:flex-start;gap:9px;line-height:1.4}.checks input,.consent input{width:18px;min-height:18px;margin-top:1px}.honeypot{position:absolute;left:-10000px}.submit{min-height:50px;border:0;border-radius:12px;background:#0071e3;color:#fff;font-weight:850;cursor:pointer}.submit:disabled{opacity:.55}.error{margin:0;color:#b42318;font-size:.82rem}.ownerForm>small{color:#667085;line-height:1.45}@media(max-width:680px){.row,.row.three{grid-template-columns:1fr}.checks{display:grid;gap:10px}}
      `}</style>
    </form>
  );
}
