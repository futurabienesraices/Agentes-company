"use client";

import { FormEvent, useState } from "react";

type Props = { context: unknown };

export default function HomeCommandBar({ context }: Props) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], context }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      setAnswer(payload.answer ?? payload.error ?? "No pude responder en este momento.");
    } catch {
      setAnswer("No pude conectar con Futura IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="commandWrap">
      <form className="commandBar" onSubmit={send}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pregunta o pide una acción a Futura…"
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar">
          {loading ? "…" : "↑"}
        </button>
      </form>
      {answer ? <div className="answer"><strong>Futura</strong><p>{answer}</p></div> : null}
      <style jsx>{`
        .commandWrap{display:grid;gap:10px}
        .commandBar{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:10px;align-items:center;padding:10px 10px 10px 16px;border:1px solid #e5e7eb;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.06)}
        textarea{width:100%;min-height:28px;max-height:120px;resize:none;border:0;outline:0;background:transparent;color:#111827;font:inherit;line-height:1.45;padding:3px 0}
        textarea::placeholder{color:#9ca3af}
        button{width:44px;height:44px;border:0;border-radius:15px;background:#2563eb;color:#fff;font-size:1.2rem;font-weight:800;cursor:pointer}
        button:disabled{opacity:.45;cursor:default}
        .answer{padding:13px 15px;border:1px solid #e8ebf0;border-radius:16px;background:#fff;color:#111827;box-shadow:0 8px 24px rgba(15,23,42,.04)}
        .answer strong{display:block;margin-bottom:5px;font-size:.78rem;color:#2563eb}
        .answer p{margin:0;white-space:pre-wrap;font-size:.88rem;line-height:1.55;color:#374151}
        @media(max-width:640px){.commandBar{border-radius:18px;padding-left:13px}.answer p{font-size:.84rem}}
      `}</style>
    </div>
  );
}
