"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type GrowthStatus = "Detectada" | "Priorizada" | "En diseño" | "Lista para ejecutar" | "En curso" | "Midiendo" | "Mejorar" | "Cerrada" | "Descartada";
type Opportunity = {
  id: string;
  title: string;
  status: GrowthStatus;
  category: string;
  score: number;
  probability?: number;
  expectedCost?: number;
  effort?: number;
  daysToRevenue?: number;
  automation: string;
  aiAction: string;
  humanAction: string;
  nextAction: string;
  owner: "IA" | "Usuario" | "Ambos";
  targetMetric: string;
  actualRevenue?: number;
  actualCost?: number;
  learning: string;
  reviewAt: string;
  ethical: boolean;
};

type Draft = {
  title: string;
  category: string;
  probability: string;
  expectedCost: string;
  effort: string;
  daysToRevenue: string;
  automation: string;
  aiAction: string;
  humanAction: string;
  nextAction: string;
  targetMetric: string;
};

const STATUSES: GrowthStatus[] = ["Detectada", "Priorizada", "En diseño", "Lista para ejecutar", "En curso", "Midiendo", "Mejorar", "Cerrada", "Descartada"];
const CATEGORIES = ["Captación propietarios", "Seguimiento compradores", "Publicación", "Contenido", "Remarketing", "Referidos", "Agenda de visitas", "Documentación", "CRM", "Ahorro operativo", "Producto digital", "Otra"];
const EMPTY_DRAFT: Draft = { title: "", category: "Captación propietarios", probability: "70", expectedCost: "0", effort: "2", daysToRevenue: "14", automation: "", aiAction: "", humanAction: "", nextAction: "", targetMetric: "" };

export default function GrowthBacklog() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/growth", { cache: "no-store" });
      const payload = (await response.json()) as { opportunities?: Opportunity[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar Growth AI.");
      setOpportunities(payload.opportunities ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo cargar Growth AI."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const active = useMemo(() => opportunities.filter((item) => !["Cerrada", "Descartada"].includes(item.status)), [opportunities]);
  const top = active[0];
  const inProgress = active.filter((item) => ["En diseño", "Lista para ejecutar", "En curso", "Midiendo", "Mejorar"].includes(item.status)).length;

  async function detect() {
    if (working) return;
    setWorking(true); setMessage("");
    try {
      const response = await fetch("/api/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "detect" }) });
      const payload = (await response.json()) as { opportunities?: Opportunity[]; message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo analizar el negocio.");
      setOpportunities(payload.opportunities ?? []);
      setMessage(payload.message ?? "Análisis completado.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo analizar el negocio."); }
    finally { setWorking(false); }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || working) return;
    setWorking(true); setMessage("");
    try {
      const opportunity = {
        title: draft.title.trim(), category: draft.category, status: "Detectada", owner: "Ambos", ethical: true,
        probability: Math.max(0, Math.min(100, Number(draft.probability) || 0)) / 100,
        expectedCost: Math.max(0, Number(draft.expectedCost) || 0),
        effort: Math.max(1, Math.min(10, Number(draft.effort) || 5)),
        daysToRevenue: Math.max(1, Number(draft.daysToRevenue) || 30),
        automation: draft.automation.trim(), aiAction: draft.aiAction.trim(), humanAction: draft.humanAction.trim(), nextAction: draft.nextAction.trim(), targetMetric: draft.targetMetric.trim(),
      };
      const response = await fetch("/api/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", opportunity }) });
      const payload = (await response.json()) as { opportunity?: Opportunity; message?: string; error?: string };
      if (!response.ok || !payload.opportunity) throw new Error(payload.error || "No se pudo guardar la oportunidad.");
      setOpportunities((current) => [payload.opportunity!, ...current].sort((a, b) => b.score - a.score));
      setDraft(EMPTY_DRAFT); setShowForm(false); setMessage(payload.message ?? "Oportunidad añadida.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la oportunidad."); }
    finally { setWorking(false); }
  }

  async function update(id: string, changes: Partial<Opportunity>) {
    if (working) return;
    setWorking(true); setMessage("");
    try {
      const response = await fetch("/api/growth", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, changes }) });
      const payload = (await response.json()) as { opportunity?: Opportunity; error?: string };
      if (!response.ok || !payload.opportunity) throw new Error(payload.error || "No se pudo actualizar.");
      setOpportunities((current) => current.map((item) => item.id === id ? payload.opportunity! : item).sort((a, b) => b.score - a.score));
      setMessage("Oportunidad actualizada.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); }
    finally { setWorking(false); }
  }

  return (
    <section className="growth">
      <header className="hero">
        <div><p>AGENTE GROWTH AI</p><h1>Backlog vivo de crecimiento.</h1><span>Prioriza oportunidades por retorno, rapidez, costo y esfuerzo. El análisis operativo no consume tokens de IA.</span></div>
        <div className="heroActions"><button onClick={detect} disabled={working}>{working ? "Analizando…" : "Detectar oportunidades"}</button><button className="ghost" onClick={() => setShowForm((value) => !value)}>+ Nueva</button></div>
      </header>

      <div className="stats"><article><strong>{active.length}</strong><span>oportunidades activas</span></article><article><strong>{inProgress}</strong><span>en ejecución o medición</span></article><article><strong>{top?.score ?? 0}</strong><span>ROI de la prioridad actual</span></article></div>

      {top ? <article className="topOpportunity">
        <div className="topLabel"><span>PRIORIDAD #1</span><b>{top.score}/100</b></div>
        <div className="topGrid"><div><small>{top.category}</small><h2>{top.title}</h2><p>{top.nextAction || top.automation}</p><div className="chips"><span>{top.owner}</span>{top.daysToRevenue ? <span>{top.daysToRevenue} días a ingresos</span> : null}{top.expectedCost !== undefined ? <span>Costo estimado ${top.expectedCost}</span> : null}</div></div><div className="roles"><article><span>Growth AI ejecuta</span><p>{top.aiAction || "Diseñar, ordenar y medir la automatización."}</p></article><article><span>Tú ejecutas</span><p>{top.humanAction || "Aprobar decisiones y realizar acciones humanas."}</p></article></div></div>
      </article> : null}

      {showForm ? <form className="newForm" onSubmit={create}>
        <div className="formHeader"><div><p>NUEVA OPORTUNIDAD</p><h2>Añadir al backlog</h2></div><button type="button" className="close" onClick={() => setShowForm(false)}>Cerrar</button></div>
        <div className="fields">
          <label className="wide"><span>Oportunidad</span><input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ejemplo: reactivar compradores sin seguimiento" /></label>
          <label><span>Categoría</span><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Probabilidad estimada %</span><input type="number" min="0" max="100" value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: e.target.value })} /></label>
          <label><span>Costo esperado</span><input type="number" min="0" value={draft.expectedCost} onChange={(e) => setDraft({ ...draft, expectedCost: e.target.value })} /></label>
          <label><span>Esfuerzo 1–10</span><input type="number" min="1" max="10" value={draft.effort} onChange={(e) => setDraft({ ...draft, effort: e.target.value })} /></label>
          <label><span>Días a ingresos</span><input type="number" min="1" value={draft.daysToRevenue} onChange={(e) => setDraft({ ...draft, daysToRevenue: e.target.value })} /></label>
          <label className="wide"><span>Automatización propuesta</span><textarea value={draft.automation} onChange={(e) => setDraft({ ...draft, automation: e.target.value })} /></label>
          <label><span>Qué hace Growth AI</span><textarea value={draft.aiAction} onChange={(e) => setDraft({ ...draft, aiAction: e.target.value })} /></label>
          <label><span>Qué haces tú</span><textarea value={draft.humanAction} onChange={(e) => setDraft({ ...draft, humanAction: e.target.value })} /></label>
          <label className="wide"><span>Próxima acción</span><textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} /></label>
          <label className="wide"><span>Métrica objetivo</span><textarea value={draft.targetMetric} onChange={(e) => setDraft({ ...draft, targetMetric: e.target.value })} /></label>
        </div>
        <button className="save" disabled={working}>Calcular ROI y guardar</button>
      </form> : null}

      <section className="backlog">
        <div className="sectionHeader"><div><p>BACKLOG PRIORIZADO</p><h2>Oportunidades por retorno esperado</h2></div><span>{loading ? "Cargando…" : `${opportunities.length} registros en Airtable`}</span></div>
        {loading ? <div className="empty">Cargando backlog…</div> : opportunities.length ? <div className="list">{opportunities.map((item, index) => <article className={index === 0 ? "item first" : "item"} key={item.id}>
          <div className="rank"><strong>{String(index + 1).padStart(2, "0")}</strong><b>{item.score}</b></div>
          <div className="copy"><div><span>{item.category}</span><em>{item.owner}</em></div><h3>{item.title}</h3><p>{item.nextAction || item.automation || "Sin próxima acción definida."}</p><small>{item.targetMetric || "Define una métrica antes de ejecutar."}</small></div>
          <div className="controls"><select value={item.status} onChange={(e) => update(item.id, { status: e.target.value as GrowthStatus })} disabled={working}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => { const learning = window.prompt("Resultado o aprendizaje de esta oportunidad:", item.learning || ""); if (learning !== null) update(item.id, { learning, status: "Midiendo" }); }} disabled={working}>Medir</button></div>
        </article>)}</div> : <div className="empty">No hay oportunidades todavía.</div>}
      </section>

      {message ? <p className="message">{message}</p> : null}

      <style jsx>{`
        .growth{max-width:1280px;margin:0 auto;padding:34px;color:#111827}.hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-end}.hero p,.sectionHeader p,.formHeader p{margin:0 0 8px;color:#6b7280;font-size:.68rem;font-weight:900;letter-spacing:.15em}.hero h1{margin:0;font-size:clamp(2.2rem,5vw,4rem);letter-spacing:-.06em}.hero span{display:block;max-width:720px;margin-top:12px;color:#6b7280}.heroActions{display:flex;gap:8px}.heroActions button,.save,.close,.controls button{height:42px;padding:0 15px;border:0;border-radius:12px;background:#0071e3;color:#fff;font-weight:850;cursor:pointer}.heroActions .ghost,.close,.controls button{background:#eef2f7;color:#172033}.heroActions button:disabled,.save:disabled,.controls button:disabled{opacity:.45}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:26px 0}.stats article{padding:18px;border:1px solid #e5e7eb;border-radius:18px;background:#fff}.stats strong,.stats span{display:block}.stats strong{font-size:2rem;letter-spacing:-.04em}.stats span{margin-top:4px;color:#6b7280;font-size:.78rem}.topOpportunity{padding:24px;border-radius:24px;background:linear-gradient(145deg,#111827,#1d2940);color:#fff;box-shadow:0 22px 55px rgba(17,24,39,.16)}.topLabel{display:flex;justify-content:space-between;align-items:center;color:#9fb5d6;font-size:.7rem;font-weight:900;letter-spacing:.12em}.topLabel b{display:grid;place-items:center;min-width:58px;height:34px;border-radius:999px;background:#0071e3;color:#fff;letter-spacing:0}.topGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;margin-top:15px}.topGrid small{color:#9fb5d6}.topGrid h2{margin:7px 0 9px;font-size:2rem;letter-spacing:-.04em}.topGrid p{margin:0;color:#d4dbe6;line-height:1.5}.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}.chips span{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.08);color:#d7deea;font-size:.68rem}.roles{display:grid;gap:9px}.roles article{padding:15px;border-radius:16px;background:rgba(255,255,255,.07)}.roles span{font-size:.68rem;font-weight:900;color:#8bbdff}.roles p{margin-top:7px;font-size:.78rem}.newForm,.backlog{margin-top:20px;padding:24px;border:1px solid #e5e7eb;border-radius:24px;background:#fff;box-shadow:0 14px 36px rgba(17,24,39,.05)}.formHeader,.sectionHeader{display:flex;justify-content:space-between;gap:18px;align-items:center}.formHeader h2,.sectionHeader h2{margin:0;letter-spacing:-.035em}.sectionHeader>span{color:#6b7280;font-size:.75rem}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:20px 0}.fields label{display:grid;gap:7px}.fields label>span{font-size:.7rem;font-weight:850;color:#4b5563}.fields .wide{grid-column:1/-1}.fields input,.fields select,.fields textarea,.controls select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #dbe1e8;border-radius:12px;background:#fff;font:inherit}.fields textarea{min-height:76px;resize:vertical}.list{display:grid;gap:9px;margin-top:17px}.item{display:grid;grid-template-columns:65px minmax(0,1fr) auto;gap:15px;align-items:center;padding:15px;border:1px solid #e6eaf0;border-radius:17px;background:#fbfcfe}.item.first{border-color:#b8d8ff;background:#f4f9ff}.rank strong,.rank b{display:block}.rank strong{color:#9ca3af;font-size:.68rem}.rank b{margin-top:5px;font-size:1.55rem;color:#0071e3}.copy>div{display:flex;gap:8px;align-items:center}.copy span,.copy em{font-size:.65rem;font-weight:850;color:#6b7280}.copy em{padding:3px 6px;border-radius:999px;background:#eef2f7;font-style:normal}.copy h3{margin:7px 0 4px}.copy p{margin:0;color:#4b5563;font-size:.78rem}.copy small{display:block;margin-top:7px;color:#7b8492}.controls{display:flex;gap:7px;align-items:center}.controls select{min-width:145px}.controls button{height:38px}.empty{margin-top:15px;padding:24px;border:1px dashed #cbd5e1;border-radius:15px;color:#6b7280;text-align:center}.message{position:sticky;bottom:18px;margin:18px auto 0;max-width:640px;padding:12px 14px;border-radius:12px;background:#111827;color:#fff;text-align:center;font-size:.8rem;box-shadow:0 10px 30px rgba(17,24,39,.18)}@media(max-width:820px){.growth{padding:20px}.hero{display:block}.heroActions{margin-top:16px}.stats,.topGrid,.fields{grid-template-columns:1fr}.fields .wide{grid-column:auto}.item{grid-template-columns:48px 1fr}.controls{grid-column:1/-1}.controls select{flex:1}.sectionHeader{align-items:flex-start;flex-direction:column}}
      `}</style>
    </section>
  );
}
