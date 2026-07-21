"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = { provider: string; ready: boolean; note?: string };
type IntegrationStatus = { image: Status; voice: Status; video: Status };
type PropertyStatus = "new" | "active" | "low" | "old" | "paused";
type PropertyInput = { name: string; location: string; price: string; details: string; status: PropertyStatus; previousContent: string };
type Piece = { format: string; channel: string; title: string; body: string; cta: string };
type Plan = { classification: string; objective: string; angle: string; recommendation: string; cadence: string; carousel: { slide: number; title: string; copy: string }[]; pieces: Piece[]; metrics: string[] };
type QueueItem = { id: string; property: string; classification: string; angle: string; scheduledFor: string; channels: string[]; status: "approved" | "scheduled"; plan: Plan };

const QUEUE_KEY = "futura-editorial-queue-v1";
const EMPTY_PROPERTY: PropertyInput = { name: "", location: "", price: "", details: "", status: "new", previousContent: "" };

export default function ContentFactory() {
  const [property, setProperty] = useState<PropertyInput>(EMPTY_PROPERTY);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    fetch("/api/content/status").then((response) => response.json()).then(setStatus).catch(() => setStatus(null));
    try { setQueue(JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]")); } catch { setQueue([]); }
  }, []);

  useEffect(() => { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }, [queue]);

  const dailySummary = useMemo(() => {
    const scheduled = queue.filter((item) => item.status === "scheduled").length;
    const approved = queue.filter((item) => item.status === "approved").length;
    return { scheduled, approved, total: queue.length };
  }, [queue]);

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    if (!property.name.trim() || loading) return;
    setLoading(true); setMessage(""); setPlan(null);
    try {
      const response = await fetch("/api/content/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property }) });
      const payload = (await response.json()) as { plan?: Plan; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error || "No se pudo crear la campaña.");
      setPlan(payload.plan);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo crear la campaña."); }
    finally { setLoading(false); }
  }

  function approvePlan(schedule: boolean) {
    if (!plan) return;
    const channels = Array.from(new Set(plan.pieces.map((piece) => piece.channel)));
    const item: QueueItem = { id: crypto.randomUUID(), property: property.name, classification: plan.classification, angle: plan.angle, scheduledFor: schedule ? scheduledFor : "", channels, status: schedule ? "scheduled" : "approved", plan };
    setQueue((current) => [item, ...current]);
    setMessage(schedule ? "Campaña aprobada y añadida al calendario." : "Campaña aprobada y guardada en la cola editorial.");
    setPlan(null); setProperty(EMPTY_PROPERTY); setScheduledFor("");
  }

  async function copyText(text: string) { await navigator.clipboard.writeText(text); setMessage("Texto copiado."); }

  return (
    <section className="factory">
      <div className="heading"><div><p>FÁBRICA EDITORIAL</p><h1>Publica sin repetir.</h1><span>Clasifica propiedades nuevas y antiguas, crea nuevos ángulos y organiza una cola diaria con aprobación humana.</span></div><div className="daily"><strong>{dailySummary.total}</strong><span>campañas en cola</span><small>{dailySummary.scheduled} programadas · {dailySummary.approved} aprobadas</small></div></div>

      <div className="statusGrid">
        {status ? Object.entries(status).map(([key, item]) => <article key={key}><i className={item.ready ? "ready" : "pending"} /><div><strong>{item.provider}</strong><span>{item.ready ? "Conectado" : "Configuración pendiente"}</span></div></article>) : <article><div><strong>Comprobando integraciones…</strong></div></article>}
      </div>

      <form className="planner" onSubmit={createPlan}>
        <div className="plannerHeader"><div><p>01 · PROPIEDAD</p><h2>Crear campaña o relanzamiento</h2></div><span>Futura evita reutilizar el mismo titular, portada y enfoque.</span></div>
        <div className="fields">
          <label><span>Propiedad</span><input value={property.name} onChange={(e) => setProperty({ ...property, name: e.target.value })} placeholder="Departamento Roma Norte" required /></label>
          <label><span>Ubicación</span><input value={property.location} onChange={(e) => setProperty({ ...property, location: e.target.value })} placeholder="Ciudad y zona" /></label>
          <label><span>Precio</span><input value={property.price} onChange={(e) => setProperty({ ...property, price: e.target.value })} placeholder="$3,500,000 MXN" /></label>
          <label><span>Estado editorial</span><select value={property.status} onChange={(e) => setProperty({ ...property, status: e.target.value as PropertyStatus })}><option value="new">Nueva</option><option value="active">Activa con buen rendimiento</option><option value="low">Activa con poca interacción</option><option value="old">Antigua para relanzamiento</option><option value="paused">Pausada</option></select></label>
          <label className="wide"><span>Datos reales de la propiedad</span><textarea value={property.details} onChange={(e) => setProperty({ ...property, details: e.target.value })} placeholder="Metros, recámaras, amenidades, fotografías disponibles y comprador ideal." /></label>
          <label className="wide"><span>Qué ya se publicó</span><textarea value={property.previousContent} onChange={(e) => setProperty({ ...property, previousContent: e.target.value })} placeholder="Titulares, enfoque, formatos y fechas anteriores. Futura buscará una dirección distinta." /></label>
        </div>
        <button className="primary" disabled={loading || !property.name.trim()}>{loading ? "Analizando historial y creando…" : "Generar dirección editorial"}</button>
      </form>

      {plan ? <section className="plan">
        <div className="planTop"><div><p>02 · DIRECCIÓN RECOMENDADA</p><h2>{plan.angle}</h2><span>{plan.recommendation}</span></div><div className="classification"><strong>{plan.classification}</strong><span>{plan.cadence}</span></div></div>
        <div className="planMeta"><article><span>Objetivo</span><strong>{plan.objective}</strong></article><article><span>Formato principal</span><strong>Carrusel de 7 láminas</strong></article><article><span>Video</span><strong>Reel sencillo con fotos reales</strong></article></div>

        <div className="sectionTitle"><div><p>03 · CARRUSEL</p><h3>Secuencia principal</h3></div><button onClick={() => copyText(plan.carousel.map((slide) => `${slide.slide}. ${slide.title}\n${slide.copy}`).join("\n\n"))}>Copiar carrusel</button></div>
        <div className="carouselGrid">{plan.carousel.map((slide) => <article key={slide.slide}><b>{String(slide.slide).padStart(2, "0")}</b><strong>{slide.title}</strong><p>{slide.copy}</p></article>)}</div>

        <div className="sectionTitle"><div><p>04 · ADAPTACIONES</p><h3>Piezas por canal</h3></div></div>
        <div className="pieces">{plan.pieces.map((piece, index) => <article key={`${piece.format}-${index}`}><div><span>{piece.format} · {piece.channel}</span><button onClick={() => copyText(`${piece.title}\n\n${piece.body}\n\n${piece.cta}`)}>Copiar</button></div><h4>{piece.title}</h4><p>{piece.body}</p><strong>{piece.cta}</strong></article>)}</div>

        <div className="approval"><div><strong>Aprobación obligatoria</strong><span>Nada se publica automáticamente. Primero se guarda o se programa.</span></div><input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} /><button className="secondary" onClick={() => approvePlan(false)}>Aprobar y guardar</button><button className="primary" disabled={!scheduledFor} onClick={() => approvePlan(true)}>Programar campaña</button></div>
      </section> : null}

      <section className="queueSection"><div className="sectionTitle"><div><p>05 · COLA EDITORIAL</p><h3>Próximas campañas</h3></div></div>{queue.length ? <div className="queue">{queue.map((item) => <article key={item.id}><div><span className={`badge ${item.status}`}>{item.status === "scheduled" ? "Programada" : "Aprobada"}</span><strong>{item.property}</strong><p>{item.angle}</p><small>{item.classification} · {item.channels.join(", ")}{item.scheduledFor ? ` · ${new Date(item.scheduledFor).toLocaleString("es-MX")}` : ""}</small></div><button onClick={() => setQueue((current) => current.filter((entry) => entry.id !== item.id))}>Quitar</button></article>)}</div> : <div className="empty">Todavía no hay campañas aprobadas.</div>}</section>

      {message ? <p className="message">{message}</p> : null}

      <style jsx>{`
        .factory{padding:34px;max-width:1280px;margin:0 auto;color:#111827}.heading{display:flex;justify-content:space-between;gap:24px;align-items:flex-end}.heading p,.plannerHeader p,.planTop p,.sectionTitle p{margin:0 0 8px;color:#6b7280;font-size:.68rem;font-weight:800;letter-spacing:.14em}.heading h1{margin:0;font-size:2.6rem;letter-spacing:-.055em}.heading span,.plannerHeader span,.planTop span{display:block;margin-top:8px;color:#6b7280}.daily{min-width:190px;padding:18px;border-radius:18px;background:#111827;color:#fff}.daily strong,.daily span,.daily small{display:block}.daily strong{font-size:2rem}.daily span{font-weight:800}.daily small{margin-top:5px;color:#9ca3af}.statusGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:26px 0}.statusGrid article{display:flex;gap:10px;align-items:center;padding:14px 16px;border:1px solid #e5e7eb;border-radius:16px;background:#fff}.statusGrid i{width:9px;height:9px;border-radius:50%}.ready{background:#22c55e}.pending{background:#f59e0b}.statusGrid strong,.statusGrid span{display:block}.statusGrid span{margin-top:3px;color:#6b7280;font-size:.72rem}.planner,.plan,.queueSection{padding:24px;border:1px solid #e5e7eb;border-radius:24px;background:#fff;box-shadow:0 14px 36px rgba(17,24,39,.05);margin-bottom:20px}.plannerHeader,.planTop,.sectionTitle,.approval{display:flex;justify-content:space-between;gap:20px;align-items:center}.plannerHeader h2,.planTop h2,.sectionTitle h3{margin:0;letter-spacing:-.03em}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:22px 0}.fields label{display:grid;gap:7px}.fields label>span{font-size:.72rem;font-weight:800;color:#4b5563}.fields .wide{grid-column:1/-1}.fields input,.fields select,.fields textarea,.approval input{width:100%;box-sizing:border-box;border:1px solid #dbe1e8;border-radius:13px;padding:12px;font:inherit;background:#fff}.fields textarea{min-height:90px;resize:vertical}.primary,.secondary,.sectionTitle button,.pieces button,.queue button{border:0;border-radius:12px;padding:0 15px;height:42px;font-weight:800;cursor:pointer}.primary{background:#0071e3;color:#fff}.secondary,.sectionTitle button,.pieces button,.queue button{background:#eef2f7;color:#172033}.primary:disabled{opacity:.4;cursor:not-allowed}.classification{padding:13px 15px;border-radius:14px;background:#eef6ff}.classification strong,.classification span{display:block}.classification span{font-size:.72rem}.planMeta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.planMeta article{padding:14px;border-radius:15px;background:#f7f9fc}.planMeta span,.planMeta strong{display:block}.planMeta span{font-size:.68rem;color:#6b7280}.planMeta strong{margin-top:5px;font-size:.82rem}.sectionTitle{margin:22px 0 12px}.carouselGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.carouselGrid article{min-height:150px;padding:15px;border:1px solid #e5e7eb;border-radius:16px;background:#fbfcfe}.carouselGrid b,.carouselGrid strong{display:block}.carouselGrid b{color:#0071e3;font-size:.7rem}.carouselGrid strong{margin-top:18px}.carouselGrid p,.pieces p{color:#596273;font-size:.78rem;line-height:1.5}.pieces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pieces article{padding:16px;border:1px solid #e5e7eb;border-radius:16px}.pieces article>div{display:flex;justify-content:space-between;align-items:center;gap:10px}.pieces span{font-size:.68rem;font-weight:800;color:#6b7280}.pieces button{height:30px;font-size:.68rem}.pieces h4{margin:14px 0 0}.pieces article>strong{font-size:.75rem;color:#0071e3}.approval{margin-top:20px;padding:16px;border-radius:16px;background:#111827;color:#fff}.approval div strong,.approval div span{display:block}.approval div span{margin-top:4px;color:#9ca3af;font-size:.72rem}.approval input{max-width:210px}.queue{display:grid;gap:9px}.queue article{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:14px;border-radius:15px;background:#f8fafc}.queue strong,.queue p,.queue small{display:block}.queue strong{margin-top:7px}.queue p{margin:4px 0;color:#4b5563}.queue small{color:#6b7280}.badge{display:inline-block;padding:4px 7px;border-radius:999px;font-size:.62rem;font-weight:800}.badge.scheduled{background:#dbeafe;color:#1d4ed8}.badge.approved{background:#e5e7eb;color:#374151}.empty{padding:24px;border:1px dashed #cbd5e1;border-radius:16px;text-align:center;color:#6b7280}.message{position:sticky;bottom:18px;margin:0 auto;padding:12px 16px;max-width:520px;border-radius:13px;background:#111827;color:#fff;text-align:center;font-size:.8rem}@media(max-width:800px){.factory{padding:20px}.heading,.plannerHeader,.planTop,.approval{align-items:stretch;flex-direction:column}.daily{min-width:0}.statusGrid,.fields,.planMeta,.carouselGrid,.pieces{grid-template-columns:1fr}.fields .wide{grid-column:auto}.approval input{max-width:none}}
      `}</style>
    </section>
  );
}
