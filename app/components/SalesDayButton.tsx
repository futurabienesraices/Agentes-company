"use client";

import { useState } from "react";

export default function SalesDayButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createDay() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" } });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo crear la jornada.");
      setMessage(payload.message || "Jornada creada.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la jornada.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dayAction">
      <button type="button" onClick={createDay} disabled={loading}>{loading ? "Organizando…" : "Crear jornada de ventas"}</button>
      {message ? <span>{message}</span> : null}
      <style jsx>{`
        .dayAction{display:grid;justify-items:end;gap:8px}.dayAction button{min-height:46px;border:0;border-radius:12px;background:#0071e3;color:#fff;padding:0 18px;font-weight:850;cursor:pointer;box-shadow:0 10px 24px rgba(0,113,227,.2)}.dayAction button:disabled{opacity:.55}.dayAction span{max-width:320px;color:#667085;font-size:.75rem;text-align:right}@media(max-width:700px){.dayAction{justify-items:stretch}.dayAction span{text-align:left}}
      `}</style>
    </div>
  );
}
