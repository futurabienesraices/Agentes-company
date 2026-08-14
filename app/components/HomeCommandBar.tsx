"use client";

import { FormEvent, useState } from "react";

type ChatItem = { role: "user" | "assistant"; content: string };
type Usage = { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
type ResponsePayload = { answer?: string; error?: string; missing?: string[]; usage?: Usage };
type Props = { context: unknown };

export default function HomeCommandBar({ context }: Props) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [loading, setLoading] = useState(false);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const nextHistory = [...history, { role: "user" as const, content: prompt }];
    setHistory(nextHistory);
    setInput("");
    setMissing([]);
    setLoading(true);

    try {
      const response = await fetch("/api/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory, context }),
      });
      const payload = (await response.json()) as ResponsePayload;
      const answer = payload.answer ?? payload.error ?? "No pude responder en este momento.";
      setHistory((current) => [...current, { role: "assistant", content: answer }]);
      setMissing(payload.missing?.filter(Boolean).slice(0, 3) ?? []);
      const totalTokens = payload.usage?.totalTokens;\n      if (totalTokens) setSessionTokens((current) => current + totalTokens);
    } catch {
      setHistory((current) => [...current, { role: "assistant", content: "No pude conectar con Futura IA." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="commandWrap">
      <div className="conversation" aria-live="polite">
        {history.length ? history.map((message, index) => (
          <article className={`message ${message.role}`} key={`${index}-${message.content.slice(0, 24)}`}>
            <span>{message.role === "assistant" ? "Futura IA" : "Tú"}</span>
            <p>{message.content}</p>
          </article>
        )) : <p className="welcome">Pregunta, decide o activa una acción. Futura te dirá qué falta cuando no haya información suficiente.</p>}
        {loading ? <p className="thinking">Futura está revisando tus datos…</p> : null}
      </div>

      {missing.length ? (
        <aside className="missing" aria-label="Información necesaria">
          <strong>Para avanzar</strong>
          <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      ) : null}

      <div className="aiMeta">
        <span><i /> Gemini activo</span>
        <span title="Contador de esta sesión. El acumulado global se habilita al conectar la telemetría.">
          Tokens sesión: {sessionTokens ? sessionTokens.toLocaleString("es-SV") : "—"}
        </span>
      </div>

      <form className="commandBar" onSubmit={send}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pregúntame sobre tu negocio…"
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar consulta">
          {loading ? "…" : "↑"}
        </button>
      </form>

      <style jsx>{`
        .commandWrap{min-height:min(44svh,500px);display:grid;grid-template-rows:minmax(170px,1fr) auto auto auto;align-content:end;gap:10px}
        .conversation{display:grid;align-content:end;gap:12px;overflow:auto;padding:22px 4px 6px;scrollbar-width:none}.conversation::-webkit-scrollbar{display:none}
        .welcome{max-width:420px;margin:0 auto;color:#9ca3af;font-size:.86rem;line-height:1.6;text-align:center}
        .message{max-width:760px}.message.user{justify-self:end;text-align:right}.message span{display:block;margin-bottom:3px;color:#7c3aed;font-size:.68rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.message.user span{color:#64748b}.message p{margin:0;color:#1f2937;font-size:.94rem;line-height:1.65;white-space:pre-wrap}.message.user p{color:#475569}.thinking{margin:0;color:#94a3b8;font-size:.8rem}
        .missing{display:flex;align-items:flex-start;gap:10px;padding:9px 2px;border-top:1px solid #f1f3f7;color:#64748b;font-size:.76rem}.missing strong{flex:0 0 auto;color:#a16207}.missing ul{display:flex;gap:8px;flex-wrap:wrap;margin:0;padding:0;list-style:none}.missing li{padding:3px 8px;border-radius:999px;background:#fff8e8;color:#92400e}
        .aiMeta{display:flex;justify-content:space-between;gap:12px;padding:0 4px;color:#94a3b8;font-size:.7rem}.aiMeta span{display:inline-flex;align-items:center;gap:5px}.aiMeta i{width:6px;height:6px;border-radius:50%;background:#22c55e}
        .commandBar{display:grid;grid-template-columns:minmax(0,1fr) 46px;gap:8px;align-items:center;padding:8px 8px 8px 18px;border:1px solid #dfe4ec;border-radius:999px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.08)}
        textarea{width:100%;min-height:30px;max-height:120px;resize:none;border:0;outline:0;background:transparent;color:#111827;font:inherit;line-height:1.45;padding:4px 0}textarea::placeholder{color:#9ca3af}
        button{width:46px;height:46px;border:0;border-radius:50%;background:#2563eb;color:#fff;font-size:1.2rem;font-weight:800;cursor:pointer}button:disabled{opacity:.45;cursor:default}
        @media(max-width:640px){.commandWrap{min-height:42svh}.conversation{padding-top:12px}.message p{font-size:.88rem}.aiMeta{font-size:.66rem}.commandBar{padding-left:15px}}
      `}</style>
    </div>
  );
}
