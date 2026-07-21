"use client";

import { useEffect, useState } from "react";

type Status = { provider: string; ready: boolean; note?: string };
type IntegrationStatus = { image: Status; voice: Status; video: Status };

export default function ContentFactory() {
  const [prompt, setPrompt] = useState("");
  const [script, setScript] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState<"image" | "voice" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/content/status").then((response) => response.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  async function generateImage() {
    if (!prompt.trim() || loading) return;
    setLoading("image");
    setMessage("");
    try {
      const response = await fetch("/api/content/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const payload = (await response.json()) as { imageUrl?: string; error?: string };
      if (!response.ok || !payload.imageUrl) throw new Error(payload.error || "No se pudo generar la imagen.");
      setImageUrl(payload.imageUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar la imagen.");
    } finally { setLoading(null); }
  }

  async function generateVoice() {
    if (!script.trim() || loading) return;
    setLoading("voice");
    setMessage("");
    try {
      const response = await fetch("/api/content/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: script }) });
      const payload = (await response.json()) as { audioUrl?: string; error?: string };
      if (!response.ok || !payload.audioUrl) throw new Error(payload.error || "No se pudo generar la narración.");
      setAudioUrl(payload.audioUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo generar la narración.");
    } finally { setLoading(null); }
  }

  return (
    <section className="factory">
      <div className="heading"><div><p>FÁBRICA DE CONTENIDO</p><h1>Crea material para campañas.</h1><span>Genera imágenes, narraciones y prepara video desde un solo espacio.</span></div></div>

      <div className="statusGrid">
        {status ? Object.entries(status).map(([key, item]) => <article key={key}><i className={item.ready ? "ready" : "pending"} /><div><strong>{item.provider}</strong><span>{item.ready ? "Conectado" : "Configuración pendiente"}</span></div></article>) : <article><div><strong>Comprobando integraciones…</strong></div></article>}
      </div>

      <div className="toolGrid">
        <article className="toolCard">
          <div><p>IMAGEN</p><h2>OpenAI Images</h2><span>Genera anuncios, portadas y visuales para propiedades.</span></div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ejemplo: anuncio inmobiliario premium de un departamento moderno, luz natural, formato para Instagram" />
          <button onClick={generateImage} disabled={!prompt.trim() || loading !== null}>{loading === "image" ? "Generando…" : "Generar imagen"}</button>
          {imageUrl ? <img src={imageUrl} alt="Contenido generado" /> : null}
        </article>

        <article className="toolCard">
          <div><p>VOZ</p><h2>ElevenLabs</h2><span>Convierte guiones en narraciones listas para video.</span></div>
          <textarea value={script} onChange={(event) => setScript(event.target.value)} placeholder="Pega aquí el guion del anuncio o recorrido de la propiedad." />
          <button onClick={generateVoice} disabled={!script.trim() || loading !== null}>{loading === "voice" ? "Generando…" : "Generar narración"}</button>
          {audioUrl ? <audio controls src={audioUrl} /> : null}
        </article>

        <article className="toolCard videoCard">
          <div><p>VIDEO</p><h2>Adobe Firefly</h2><span>Preparado para generar clips cuando se conecten las credenciales de Adobe.</span></div>
          <div className="videoPlaceholder"><strong>Video generativo</strong><span>Requiere ADOBE_FIREFLY_CLIENT_ID y ADOBE_FIREFLY_CLIENT_SECRET.</span></div>
        </article>
      </div>

      {message ? <p className="message">{message}</p> : null}

      <style jsx>{`
        .factory{padding:34px;max-width:1240px;margin:0 auto;color:#111827}.heading p,.toolCard p{margin:0 0 8px;color:#6b7280;font-size:.68rem;font-weight:800;letter-spacing:.14em}.heading h1{margin:0;font-size:2.5rem;letter-spacing:-.05em}.heading span,.toolCard span{display:block;margin-top:8px;color:#6b7280}.statusGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0}.statusGrid article{display:flex;gap:10px;align-items:center;padding:14px 16px;border:1px solid #e5e7eb;border-radius:16px;background:#fff}.statusGrid i{width:9px;height:9px;border-radius:50%}.statusGrid i.ready{background:#22c55e}.statusGrid i.pending{background:#f59e0b}.statusGrid strong,.statusGrid span{display:block}.statusGrid strong{font-size:.82rem}.statusGrid span{margin-top:3px;color:#6b7280;font-size:.72rem}.toolGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.toolCard{display:flex;flex-direction:column;gap:16px;padding:22px;border:1px solid #e5e7eb;border-radius:22px;background:#fff;box-shadow:0 14px 36px rgba(17,24,39,.06)}.toolCard h2{margin:0;font-size:1.3rem}.toolCard textarea{min-height:130px;padding:14px;border:1px solid #dbe1e8;border-radius:14px;resize:vertical;font:inherit}.toolCard button{height:44px;border:0;border-radius:13px;background:#0071e3;color:#fff;font-weight:800;cursor:pointer}.toolCard button:disabled{opacity:.4;cursor:not-allowed}.toolCard img{width:100%;border-radius:16px;object-fit:cover}.toolCard audio{width:100%}.videoCard{grid-column:1/-1}.videoPlaceholder{padding:22px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc}.videoPlaceholder strong,.videoPlaceholder span{display:block}.videoPlaceholder span{font-size:.78rem}.message{margin:18px 0 0;padding:12px 14px;border-radius:12px;background:#fff7ed;color:#9a3412;font-size:.82rem}@media(max-width:760px){.factory{padding:20px}.heading h1{font-size:2rem}.statusGrid,.toolGrid{grid-template-columns:1fr}.videoCard{grid-column:auto}}
      `}</style>
    </section>
  );
}
