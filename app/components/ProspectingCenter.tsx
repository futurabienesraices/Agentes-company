"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Source = "Google Places" | "Google Trends" | "Meta Pages" | "Proveedor B2B" | "Sitio web público" | "Carga manual";
type LegalBasis = "Pendiente de revisión" | "Dato público profesional" | "Licencia del proveedor" | "Consentimiento" | "No usar";
type Memory = { id: string; title: string; prospect: string; source: Source; event: string; summary: string; url: string; confidence: number; score: number; recommendedAction: string; legalBasis: LegalBasis; date: string };

const SOURCES: Array<{ id: Source; label: string; description: string; state: string; action?: "maps" | "trends" | "meta" }> = [
  { id: "Google Places", label: "Google Maps", description: "Explora negocios manualmente. No se extraen ni guardan datos de Maps.", state: "Investigación externa", action: "maps" },
  { id: "Google Trends", label: "Google Trends", description: "Detecta demanda, zonas y búsquedas relacionadas; no entrega contactos.", state: "Análisis de mercado", action: "trends" },
  { id: "Meta Pages", label: "Páginas Meta", description: "Solo datos públicos de páginas cuando la API y permisos lo permitan.", state: "Requiere conexión", action: "meta" },
  { id: "Proveedor B2B", label: "Base de datos con licencia", description: "Conector para proveedor autorizado y su política de uso/opt-out.", state: "Sin conectar" },
  { id: "Sitio web público", label: "Validación web", description: "Registra evidencia encontrada y marca la base permitida antes de contactar.", state: "Listo" },
];

const EMPTY = { title: "", prospect: "", source: "Sitio web público" as Source, summary: "", url: "", confidence: "60", score: "60", recommendedAction: "Validar sitio web y decidir si requiere contacto humano.", legalBasis: "Pendiente de revisión" as LegalBasis };

export default function ProspectingCenter() {
  const [query, setQuery] = useState("inmobiliarias en Santa Ana");
  const [memory, setMemory] = useState<Memory[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [highValueCount, setHighValueCount] = useState(0);
  const [draft, setDraft] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const searchLinks = useMemo(() => ({
    maps: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    trends: `https://trends.google.com/trends/explore?geo=SV&q=${encodeURIComponent(query)}`,
    meta: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(query)}`,
  }), [query]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/prospecting", { cache: "no-store" });
      const payload = await response.json() as { memory?: Memory[]; leadCount?: number; highValueCount?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar.");
      setMemory(payload.memory ?? []); setLeadCount(payload.leadCount ?? 0); setHighValueCount(payload.highValueCount ?? 0);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo cargar el centro."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/prospecting", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, confidence: Number(draft.confidence), score: Number(draft.score) }) });
      const payload = await response.json() as { memory?: Memory; message?: string; error?: string };
      if (!response.ok || !payload.memory) throw new Error(payload.error || "No se pudo guardar.");
      setMemory((current) => [payload.memory!, ...current]);
      if (payload.memory.score >= 70 && payload.memory.legalBasis !== "No usar") setHighValueCount((current) => current + 1);
      setDraft(EMPTY); setMessage(payload.message || "Hallazgo guardado.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  }

  return <section className="prospecting" aria-label="Centro de prospectos">
    <header className="hero"><div><p>PROSPECTING AI</p><h1>Encuentra, valida y aprende.</h1><span>Las fuentes descubren; la memoria conserva evidencia y la persona decide antes de contactar.</span></div></header>

    <label className="search"><span>Buscar sector, zona o perfil</span><div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ejemplo: restaurantes en Santa Ana" /><b>⌕</b></div></label>

    <div className="sourceGrid">{SOURCES.map((source) => <article key={source.id}><div><small>{source.state}</small><h2>{source.label}</h2><p>{source.description}</p></div>{source.action ? <a href={searchLinks[source.action]} target="_blank" rel="noreferrer">Abrir fuente ↗</a> : <button type="button" disabled>Conectar después</button>}</article>)}</div>

    <div className="stats"><article><strong>{leadCount}</strong><span>leads en CRM</span></article><article><strong>{highValueCount}</strong><span>hallazgos con puntuación ≥70</span></article><article><strong>{memory.length}</strong><span>eventos guardados</span></article></div>

    <section className="workspace">
      <form onSubmit={save} className="capture">
        <header><p>REGISTRAR HALLAZGO</p><h2>Memoria de un prospecto</h2><span>No subas ni contactes datos personales sin base de uso válida.</span></header>
        <div className="fields">
          <label><span>Prospecto o negocio</span><input required value={draft.prospect} onChange={(event) => setDraft({ ...draft, prospect: event.target.value })} placeholder="Nombre del negocio o contacto" /></label>
          <label><span>Origen</span><select value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value as Source })}>{SOURCES.map((source) => <option key={source.id}>{source.id}</option>)}<option>Carga manual</option></select></label>
          <label className="wide"><span>Hallazgo</span><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ejemplo: negocio activo sin presencia inmobiliaria clara" /></label>
          <label className="wide"><span>Evidencia y contexto</span><textarea required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Qué se observó, por qué importa y qué falta validar." /></label>
          <label><span>URL de fuente</span><input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} placeholder="https://..." /></label>
          <label><span>Base de uso</span><select value={draft.legalBasis} onChange={(event) => setDraft({ ...draft, legalBasis: event.target.value as LegalBasis })}>{["Pendiente de revisión", "Dato público profesional", "Licencia del proveedor", "Consentimiento", "No usar"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Confianza 0–100</span><input type="number" min="0" max="100" value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: event.target.value })} /></label>
          <label><span>Puntuación 0–100</span><input type="number" min="0" max="100" value={draft.score} onChange={(event) => setDraft({ ...draft, score: event.target.value })} /></label>
          <label className="wide"><span>Siguiente acción</span><textarea value={draft.recommendedAction} onChange={(event) => setDraft({ ...draft, recommendedAction: event.target.value })} /></label>
        </div>
        <button disabled={saving}>{saving ? "Guardando…" : "Guardar en memoria"}</button>
      </form>

      <section className="timeline"><header><div><p>HISTORIAL</p><h2>Qué aprendimos de cada prospecto</h2></div><button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Cargando…" : "Actualizar"}</button></header>{memory.length ? <div className="events">{memory.map((item) => <article key={item.id}><div className="score"><b>{item.score}</b><span>{item.confidence}% conf.</span></div><div><small>{item.source} · {item.event}</small><h3>{item.prospect}</h3><strong>{item.title}</strong><p>{item.summary}</p><em>{item.recommendedAction}</em>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Abrir evidencia ↗</a> : null}</div><span className={`basis ${item.legalBasis === "No usar" ? "stop" : ""}`}>{item.legalBasis}</span></article>)}</div> : <div className="empty">Aún no hay hallazgos. Cada investigación registrada construye la memoria del sistema.</div>}</section>
    </section>
    {message ? <p className="message">{message}</p> : null}
    <style jsx>{`
      .prospecting{max-width:1280px;margin:0 auto;padding:6px 0 28px;color:#111827}.hero p,.capture header p,.timeline header p{margin:0 0 7px;color:#6b7280;font-size:.67rem;font-weight:900;letter-spacing:.14em}.hero h1{margin:0;font-size:clamp(2rem,5vw,3.7rem);letter-spacing:-.06em}.hero>div>span{display:block;max-width:670px;margin-top:10px;color:#64748b;font-size:.87rem;line-height:1.5}.search{display:grid;gap:7px;margin-top:22px}.search>span,.fields label>span{color:#64748b;font-size:.69rem;font-weight:850}.search>div{display:flex;align-items:center;gap:10px;padding:0 14px;border:1px solid #dbe3ee;border-radius:16px;background:#fff}.search input{width:100%;height:48px;border:0;outline:0;background:transparent;font:inherit}.search b{color:#2563eb}.sourceGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:14px}.sourceGrid article{display:flex;min-height:176px;flex-direction:column;justify-content:space-between;padding:15px;border:1px solid #e2e8f0;border-radius:18px;background:#fff}.sourceGrid small{color:#7c3aed;font-size:.62rem;font-weight:850;text-transform:uppercase}.sourceGrid h2{margin:8px 0 6px;font-size:1rem;letter-spacing:-.03em}.sourceGrid p{margin:0;color:#64748b;font-size:.72rem;line-height:1.5}.sourceGrid a,.sourceGrid button{align-self:flex-start;margin-top:13px;border:0;background:none;color:#2563eb;font-size:.72rem;font-weight:850;text-decoration:none}.sourceGrid button:disabled{color:#94a3b8}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.stats article{padding:15px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}.stats strong,.stats span{display:block}.stats strong{font-size:1.65rem;letter-spacing:-.05em}.stats span{margin-top:3px;color:#64748b;font-size:.7rem}.workspace{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:14px}.capture,.timeline{padding:20px;border:1px solid #e2e8f0;border-radius:22px;background:#fff}.capture h2,.timeline h2{margin:0;font-size:1.35rem;letter-spacing:-.04em}.capture header>span{display:block;margin-top:8px;color:#64748b;font-size:.7rem;line-height:1.45}.fields{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin:18px 0}.fields label{display:grid;gap:6px}.fields .wide{grid-column:1/-1}.fields input,.fields select,.fields textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid #dbe3ee;border-radius:11px;background:#fff;font:inherit;font-size:.78rem}.fields textarea{min-height:70px;resize:vertical}.capture>button,.timeline header button{height:40px;padding:0 14px;border:0;border-radius:11px;background:#2563eb;color:#fff;font-weight:850;cursor:pointer}.capture>button:disabled,.timeline header button:disabled{opacity:.55}.timeline header{display:flex;justify-content:space-between;gap:12px;align-items:center}.timeline header button{height:34px;background:#eef3ff;color:#2563eb;font-size:.69rem}.events{display:grid;gap:9px;margin-top:17px}.events article{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:11px;padding:12px 0;border-top:1px solid #edf1f5}.score{display:grid;align-content:start;gap:3px}.score b{font-size:1.2rem;color:#2563eb}.score span{color:#94a3b8;font-size:.58rem}.events small{color:#7c3aed;font-size:.62rem;font-weight:850}.events h3,.events strong{display:block}.events h3{margin:5px 0 3px;font-size:.84rem}.events strong{font-size:.73rem}.events p{margin:5px 0;color:#64748b;font-size:.69rem;line-height:1.45}.events em{display:block;color:#334155;font-size:.67rem;font-style:normal}.events a{display:inline-block;margin-top:6px;color:#2563eb;font-size:.65rem;text-decoration:none}.basis{align-self:start;padding:5px 7px;border-radius:999px;background:#ecfdf5;color:#15803d;font-size:.57rem;font-weight:850}.basis.stop{background:#fef2f2;color:#dc2626}.empty{margin-top:18px;padding:22px;border:1px dashed #cbd5e1;border-radius:14px;color:#64748b;font-size:.76rem;line-height:1.5;text-align:center}.message{position:sticky;bottom:16px;z-index:2;margin:16px auto 0;width:max-content;max-width:90%;padding:10px 13px;border-radius:11px;background:#111827;color:#fff;font-size:.73rem;box-shadow:0 12px 30px rgba(15,23,42,.18)}@media(max-width:1020px){.sourceGrid{grid-template-columns:repeat(3,1fr)}.workspace{grid-template-columns:1fr}}@media(max-width:620px){.sourceGrid{grid-template-columns:1fr 1fr}.sourceGrid article{min-height:156px}.stats{grid-template-columns:1fr 1fr}.fields{grid-template-columns:1fr}.fields .wide{grid-column:auto}.events article{grid-template-columns:42px minmax(0,1fr)}.basis{grid-column:2;justify-self:start}}
    `}</style>
  </section>;
}
