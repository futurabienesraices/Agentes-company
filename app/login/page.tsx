"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code || loading) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo iniciar sesión.");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") ? next : "/");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión."); }
    finally { setLoading(false); }
  }

  return (
    <main style={{ width: "100%", maxWidth: "none", minHeight: "100dvh", margin: 0, padding: 20, display: "grid", placeItems: "center", background: "#f1f3f7" }}>
      <form onSubmit={submit} style={{ width: "min(420px, 100%)", padding: 30, border: "1px solid #e1e5ec", borderRadius: 26, background: "#fff", boxShadow: "0 24px 60px rgba(17,24,39,.1)" }}>
        <div style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 16, background: "#0071e3", color: "#fff", fontSize: 22, fontWeight: 900 }}>F</div>
        <p style={{ margin: "24px 0 8px", color: "#6b7280", fontSize: ".68rem", fontWeight: 900, letterSpacing: ".14em" }}>ACCESO PRIVADO</p>
        <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: "-.045em" }}>Futura OS</h1>
        <p style={{ color: "#6b7280", lineHeight: 1.5 }}>Protege el CRM, las automatizaciones y las APIs que consumen créditos.</p>
        <label style={{ display: "grid", gap: 7, marginTop: 22 }}><span style={{ fontSize: ".75rem", fontWeight: 800 }}>Código de acceso</span><input autoFocus type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" style={{ minHeight: 48, padding: "0 14px", border: "1px solid #cfd6df", borderRadius: 13, font: "inherit" }} /></label>
        <button disabled={loading || !code} style={{ width: "100%", height: 48, marginTop: 14, border: 0, borderRadius: 13, background: "#0071e3", color: "#fff", fontWeight: 850, opacity: loading || !code ? .5 : 1 }}>{loading ? "Verificando…" : "Entrar"}</button>
        {message ? <p style={{ margin: "14px 0 0", color: "#b42318", fontSize: ".8rem" }}>{message}</p> : null}
      </form>
    </main>
  );
}
