"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Metric = { label: string; value: number; detail: string };
type Item = { id: string; title: string; detail: string; tone: string };
type Message = { role: "user" | "assistant"; content: string };
type PendingAction = { type: "create_task"; title: string; dueAt?: string; priority?: string };
type Prospect = { name: string; type?: string; sourceUrl?: string; reason?: string; channel?: string };
type Campaign = {
  name: string;
  objective: string;
  audience: string;
  angle: string;
  socialPost: string;
  longPost: string;
  emailSubject: string;
  emailBody: string;
  whatsapp: string;
  videoScript: string;
  callToAction: string;
  channels: string[];
  metrics: string[];
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type Props = { metrics: Metric[]; priorities: Item[]; insights: Item[] };

const INITIAL_MESSAGE: Message = { role: "assistant", content: "Estoy listo. Dime qué quieres vender, investigar, publicar o automatizar." };
const STORAGE_KEY = "futura-director-conversation-v1";
const QUICK_PROMPTS = [
  "Dime las prioridades de hoy",
  "Crea una campaña para Casa Moderna",
  "Busca compradores ideales",
  "Diseña el plan de ventas de esta semana",
];

function campaignText(campaign: Campaign) {
  return [
    campaign.name,
    `Objetivo: ${campaign.objective}`,
    `Audiencia: ${campaign.audience}`,
    `Ángulo: ${campaign.angle}`,
    `Publicación corta:\n${campaign.socialPost}`,
    `Publicación larga:\n${campaign.longPost}`,
    `Correo — ${campaign.emailSubject}\n${campaign.emailBody}`,
    `WhatsApp:\n${campaign.whatsapp}`,
    `Guion de video:\n${campaign.videoScript}`,
    `CTA: ${campaign.callToAction}`,
    `Canales: ${campaign.channels.join(", ")}`,
    `Métricas: ${campaign.metrics.join(", ")}`,
  ].join("\n\n");
}

export default function FuturaAssistant({ metrics, priorities, insights }: Props) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [copied, setCopied] = useState("");
  const [executing, setExecuting] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed.slice(-20));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingAction, prospects, campaign]);

  function speak(text: string) {
    if (!voiceReplies || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    window.speechSynthesis.speak(utterance);
  }

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const value = input.trim();
    if (!value || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: value }];
    setMessages(nextMessages);
    setPendingAction(null);
    setProspects([]);
    setSelectedProspects([]);
    setCampaign(null);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12), context: { metrics, priorities, insights } }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string; pendingAction?: PendingAction; prospects?: Prospect[]; campaign?: Campaign };
      const content = payload.answer ?? payload.error ?? "No pude responder en este momento.";
      setMessages((current) => [...current, { role: "assistant", content }]);
      setPendingAction(payload.pendingAction ?? null);
      const found = payload.prospects ?? [];
      setProspects(found);
      setSelectedProspects(found.map((_, index) => index));
      setCampaign(payload.campaign ?? null);
      if (payload.answer) speak(payload.answer);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Perdí conexión con el Director IA. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!pendingAction || executing) return;
    setExecuting(true);
    try {
      const response = await fetch("/api/actions/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingAction),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      const content = payload.message ?? payload.error ?? "No pude completar la acción.";
      setMessages((current) => [...current, { role: "assistant", content }]);
      if (payload.message) speak(payload.message);
      setPendingAction(null);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "No pude conectar con Airtable para ejecutar la acción." }]);
    } finally {
      setExecuting(false);
    }
  }

  async function approveProspects() {
    const approved = prospects.filter((_, index) => selectedProspects.includes(index));
    if (!approved.length || executing) return;
    setExecuting(true);
    try {
      const response = await fetch("/api/actions/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospects: approved }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      const content = payload.message ?? payload.error ?? "No pude guardar los prospectos.";
      setMessages((current) => [...current, { role: "assistant", content }]);
      if (payload.message) speak(payload.message);
      setProspects([]);
      setSelectedProspects([]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "No pude conectar con Airtable para guardar los prospectos." }]);
    } finally {
      setExecuting(false);
    }
  }

  function toggleVoice() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setMessages((current) => [...current, { role: "assistant", content: "El dictado por voz no está disponible en este navegador." }]);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "es-MX";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => setInput(event.results[0]?.[0]?.transcript ?? "");
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function resetConversation() {
    window.speechSynthesis?.cancel();
    setMessages([INITIAL_MESSAGE]);
    setPendingAction(null);
    setProspects([]);
    setSelectedProspects([]);
    setCampaign(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section className="futuraAssistant" aria-label="Habla con Futura">
      <header className="assistantHeader">
        <div className="assistantIdentity">
          <span className="assistantOrb"><i /></span>
          <div><p>DIRECTOR IA · INTERFAZ ACTIVA</p><h2>Habla con Futura</h2><span>Investiga, crea campañas y prepara acciones con confirmación humana.</span></div>
        </div>
        <div className="assistantTools">
          <button type="button" className={voiceReplies ? "tool active" : "tool"} onClick={() => setVoiceReplies((current) => !current)}>Respuesta de voz</button>
          <button type="button" className="tool" onClick={resetConversation}>Nueva conversación</button>
          <span className="assistantStatus"><i /> Disponible</span>
        </div>
      </header>

      <div className="quickPrompts" aria-label="Consultas rápidas">
        {QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}
      </div>

      <div className="assistantConversation" ref={conversationRef} aria-live="polite">
        {messages.slice(-10).map((message, index) => (
          <div className={`assistantMessage ${message.role}`} key={`${message.role}-${index}-${message.content.slice(0, 12)}`}>
            {message.role === "assistant" ? <b>F</b> : null}<p>{message.content}</p>
          </div>
        ))}

        {pendingAction ? <div className="actionConfirmation"><div><strong>Acción preparada</strong><span>{pendingAction.title}{pendingAction.dueAt ? ` · ${pendingAction.dueAt}` : ""}</span></div><div className="actionButtons"><button type="button" onClick={executeAction} disabled={executing}>{executing ? "Creando…" : "Confirmar"}</button><button type="button" className="cancel" onClick={() => setPendingAction(null)} disabled={executing}>Cancelar</button></div></div> : null}

        {prospects.length ? <div className="prospectReview"><div className="reviewHeader"><div><strong>Prospectos encontrados</strong><span>Selecciona cuáles entran al CRM.</span></div><span>{selectedProspects.length}/{prospects.length}</span></div><div className="prospectList">{prospects.map((prospect, index) => <label className="prospectCard" key={`${prospect.name}-${index}`}><input type="checkbox" checked={selectedProspects.includes(index)} onChange={() => setSelectedProspects((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} /><div><strong>{prospect.name}</strong><small>{prospect.type || "Prospecto"}{prospect.channel ? ` · ${prospect.channel}` : ""}</small>{prospect.reason ? <p>{prospect.reason}</p> : null}{prospect.sourceUrl ? <a href={prospect.sourceUrl} target="_blank" rel="noreferrer">Ver fuente pública ↗</a> : null}</div></label>)}</div><div className="actionButtons"><button type="button" onClick={approveProspects} disabled={executing || !selectedProspects.length}>{executing ? "Guardando…" : `Agregar ${selectedProspects.length} al CRM`}</button><button type="button" className="cancel" onClick={() => { setProspects([]); setSelectedProspects([]); }} disabled={executing}>Descartar</button></div></div> : null}

        {campaign ? <div className="campaignReview"><div className="reviewHeader"><div><strong>{campaign.name}</strong><span>{campaign.objective}</span></div><button className="copyAll" type="button" onClick={() => copy("all", campaignText(campaign))}>{copied === "all" ? "Copiado" : "Copiar todo"}</button></div><div className="campaignGrid"><article><small>Audiencia</small><p>{campaign.audience}</p></article><article><small>Ángulo</small><p>{campaign.angle}</p></article></div><ContentBlock title="Publicación corta" text={campaign.socialPost} copied={copied} onCopy={copy} /><ContentBlock title="Publicación larga" text={campaign.longPost} copied={copied} onCopy={copy} /><ContentBlock title={`Correo · ${campaign.emailSubject}`} text={campaign.emailBody} copied={copied} onCopy={copy} /><ContentBlock title="WhatsApp" text={campaign.whatsapp} copied={copied} onCopy={copy} /><ContentBlock title="Guion de video" text={campaign.videoScript} copied={copied} onCopy={copy} /><div className="campaignGrid"><article><small>Llamada a la acción</small><p>{campaign.callToAction}</p></article><article><small>Canales</small><p>{campaign.channels.join(" · ")}</p></article><article><small>Métricas</small><p>{campaign.metrics.join(" · ")}</p></article></div></div> : null}

        {loading ? <div className="assistantMessage assistant"><b>F</b><p className="thinking">Investigando, escribiendo y analizando…</p></div> : null}
      </div>

      <form onSubmit={send}>
        <textarea disabled={loading} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Habla con Futura: vender, buscar clientes, crear contenido…" rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        <button className={listening ? "voice listening" : "voice"} type="button" onClick={toggleVoice} aria-label="Dictar por voz">{listening ? "●" : "⌁"}</button>
        <button className="send" disabled={loading || !input.trim()} type="submit" aria-label="Enviar mensaje">↑</button>
      </form>

      <style jsx>{`
        .futuraAssistant{position:relative;overflow:hidden;margin:0;padding:18px;border:1px solid rgba(112,231,255,.17);border-radius:17px;background:radial-gradient(circle at 12% 0%,rgba(112,231,255,.1),transparent 30%),linear-gradient(145deg,rgba(8,15,31,.92),rgba(7,10,24,.96));color:#fff;box-shadow:inset 0 1px rgba(255,255,255,.04),0 0 42px rgba(78,118,255,.07)}
        .futuraAssistant:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(112,231,255,.025),transparent)}
        .assistantHeader{position:relative;z-index:1;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.assistantIdentity{display:flex;align-items:flex-start;gap:13px}.assistantOrb{position:relative;display:grid;place-items:center;flex:0 0 45px;height:45px;border:1px solid rgba(112,231,255,.48);border-radius:15px;background:linear-gradient(145deg,rgba(112,231,255,.18),rgba(155,114,255,.42));box-shadow:0 0 24px rgba(112,231,255,.18)}.assistantOrb:before,.assistantOrb:after,.assistantOrb i{content:"";position:absolute;border:2px solid #a7f3ff;border-radius:50%}.assistantOrb:before{width:22px;height:10px;transform:rotate(35deg)}.assistantOrb:after{width:10px;height:22px;transform:rotate(35deg)}.assistantOrb i{width:6px;height:6px;background:#fff;border:0;box-shadow:0 0 12px #fff}.assistantHeader p{margin:1px 0 6px;color:#70e7ff;letter-spacing:.12em;font-size:.57rem;font-weight:900}.assistantHeader h2{margin:0;font-size:1.45rem;letter-spacing:-.04em}.assistantIdentity>div>span{display:block;margin-top:6px;color:#8290a7;font-size:.7rem;line-height:1.4}.assistantTools{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}.assistantStatus{display:flex;align-items:center;gap:7px;color:#8d9ab0;font-size:.62rem;white-space:nowrap}.assistantStatus i{width:7px;height:7px;border-radius:50%;background:#54efb4;box-shadow:0 0 10px rgba(84,239,180,.75)}.tool{height:32px;padding:0 9px;border:1px solid rgba(112,231,255,.15);border-radius:9px;background:rgba(255,255,255,.025);color:#9aa8bd;font-size:.59rem;cursor:pointer}.tool.active{background:linear-gradient(135deg,#3288ff,#865fff);border-color:transparent;color:#fff}
        .quickPrompts{position:relative;z-index:1;display:flex;gap:7px;overflow-x:auto;margin:14px 0 0;padding-bottom:2px;scrollbar-width:none}.quickPrompts::-webkit-scrollbar{display:none}.quickPrompts button{flex:0 0 auto;min-height:31px;padding:0 10px;border:1px solid rgba(112,231,255,.12);border-radius:999px;background:rgba(112,231,255,.035);color:#8392a9;font-size:.57rem;cursor:pointer}.quickPrompts button:hover{border-color:rgba(112,231,255,.35);color:#bdefff}
        .assistantConversation{position:relative;z-index:1;display:grid;gap:10px;min-height:270px;max-height:620px;overflow:auto;margin:15px 0;padding:13px;border:1px solid rgba(112,231,255,.08);border-radius:15px;background:rgba(2,7,18,.42);scrollbar-color:rgba(112,231,255,.2) transparent}.assistantMessage{display:flex;gap:9px;align-items:flex-start;max-width:87%}.assistantMessage b{display:grid;place-items:center;flex:0 0 29px;height:29px;border:1px solid rgba(112,231,255,.34);border-radius:10px;background:linear-gradient(145deg,rgba(112,231,255,.17),rgba(155,114,255,.32));color:#c8f8ff;font-size:.7rem;box-shadow:0 0 13px rgba(112,231,255,.09)}.assistantMessage p{white-space:pre-wrap;margin:0;padding:11px 13px;border:1px solid rgba(112,231,255,.08);border-radius:4px 14px 14px 14px;background:rgba(255,255,255,.045);color:#dbe5f2;font-size:.77rem;line-height:1.5}.assistantMessage.user{margin-left:auto}.assistantMessage.user p{border-color:rgba(155,114,255,.2);border-radius:14px 4px 14px 14px;background:linear-gradient(145deg,rgba(58,105,255,.25),rgba(128,84,255,.22));color:#f4f7ff}.thinking{color:#91a0b6!important}
        .actionConfirmation,.prospectReview,.campaignReview{padding:13px 14px;border:1px solid rgba(112,231,255,.16);border-radius:14px;background:rgba(67,78,180,.13)}.actionConfirmation{display:flex;justify-content:space-between;gap:15px;align-items:center}.actionConfirmation strong,.actionConfirmation span,.reviewHeader strong,.reviewHeader span{display:block}.actionConfirmation strong,.reviewHeader strong{font-size:.7rem}.actionConfirmation span,.reviewHeader span{margin-top:4px;color:#a8b5c8;font-size:.66rem}.actionButtons{display:flex;gap:7px}.actionButtons button,.copyAll{height:34px;padding:0 12px;border:1px solid rgba(112,231,255,.16);border-radius:9px;background:linear-gradient(135deg,#3188ff,#835fff);color:#fff;font-size:.64rem;cursor:pointer}.actionButtons .cancel{background:rgba(255,255,255,.04);color:#aeb9ca}
        .reviewHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:11px}.prospectList{display:grid;gap:7px;margin-bottom:11px}.prospectCard{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:10px;border:1px solid rgba(112,231,255,.07);border-radius:11px;background:rgba(255,255,255,.03);cursor:pointer}.prospectCard input{margin-top:4px}.prospectCard strong,.prospectCard small{display:block}.prospectCard small{margin-top:3px;color:#8190a6;font-size:.6rem}.prospectCard p{margin:6px 0 0;color:#bec9d8;font-size:.65rem;line-height:1.4}.prospectCard a{display:inline-block;margin-top:6px;color:#8fe9ff;font-size:.62rem;text-decoration:none}
        .campaignReview{display:grid;gap:9px;background:rgba(255,255,255,.035)}.campaignGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.campaignGrid article{padding:10px;border:1px solid rgba(112,231,255,.07);border-radius:11px;background:rgba(255,255,255,.025)}.campaignGrid small{color:#8290a7;font-size:.57rem;text-transform:uppercase;letter-spacing:.08em}.campaignGrid p{margin:5px 0 0;color:#dce5f1;font-size:.66rem;line-height:1.45}
        form{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 40px 40px;gap:7px;align-items:end;padding:7px;border:1px solid rgba(112,231,255,.2);border-radius:15px;background:linear-gradient(145deg,rgba(112,231,255,.055),rgba(155,114,255,.045));box-shadow:0 0 24px rgba(112,231,255,.04)}textarea{width:100%;resize:none;min-height:40px;max-height:120px;padding:9px 11px;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:.75rem;line-height:1.4}textarea::placeholder{color:#67758c}button{font:inherit}.voice,.send{height:40px;border:1px solid rgba(112,231,255,.12);border-radius:11px;cursor:pointer;font-weight:850}.voice{background:rgba(255,255,255,.045);color:#a9b9ce}.voice.listening{background:#ef5b69;color:#fff}.send{border:0;background:linear-gradient(135deg,#63dcff,#8661ff);color:#06101f;font-size:1rem;box-shadow:0 0 15px rgba(112,231,255,.16)}.send:disabled,.actionButtons button:disabled{opacity:.35;cursor:not-allowed}
        @media(max-width:760px){.futuraAssistant{padding:14px}.assistantHeader{display:block}.assistantTools{justify-content:flex-start;margin-top:12px}.assistantConversation{min-height:250px}.assistantMessage{max-width:95%}.actionConfirmation{align-items:flex-start;flex-direction:column}.actionButtons{width:100%}.actionButtons button{flex:1}.campaignGrid{grid-template-columns:1fr}}
        @media(max-width:430px){.assistantIdentity{gap:10px}.assistantOrb{flex-basis:39px;height:39px}.assistantHeader h2{font-size:1.25rem}.assistantIdentity>div>span{font-size:.63rem}.tool{font-size:.55rem}.assistantStatus{display:none}.assistantConversation{padding:9px}.assistantMessage p{font-size:.71rem}.quickPrompts{margin-top:11px}}
      `}</style>
    </section>
  );
}

function ContentBlock({ title, text, copied, onCopy }: { title: string; text: string; copied: string; onCopy: (label: string, text: string) => void }) {
  return <article className="contentBlock"><div><strong>{title}</strong><button type="button" onClick={() => onCopy(title, text)}>{copied === title ? "Copiado" : "Copiar"}</button></div><p>{text}</p><style jsx>{`.contentBlock{padding:11px;border:1px solid rgba(112,231,255,.07);border-radius:11px;background:rgba(255,255,255,.025)}.contentBlock>div{display:flex;justify-content:space-between;gap:11px;align-items:center}.contentBlock strong{font-size:.66rem}.contentBlock button{height:28px;padding:0 9px;border:1px solid rgba(112,231,255,.13);border-radius:8px;background:transparent;color:#a9b7c9;font-size:.57rem}.contentBlock p{white-space:pre-wrap;margin:8px 0 0;color:#dce5f1;font-size:.66rem;line-height:1.5}`}</style></article>;
}
