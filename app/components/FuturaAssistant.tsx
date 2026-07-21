"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Metric = { label: string; value: number; detail: string };
type Item = { id: string; title: string; detail: string; tone: string };
type Message = { role: "user" | "assistant"; content: string };

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

type Props = {
  metrics: Metric[];
  priorities: Item[];
  insights: Item[];
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Estoy listo. Pregúntame cómo va el negocio, qué requiere atención o qué oportunidad conviene mover primero.",
};

const STORAGE_KEY = "futura-director-conversation-v1";

export default function FuturaAssistant({ metrics, priorities, insights }: Props) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
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
  }, [messages]);

  function speak(text: string) {
    if (!voiceReplies || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const value = input.trim();
    if (!value || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: value }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-12),
          context: { metrics, priorities, insights },
        }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      const content = payload.answer ?? payload.error ?? "No pude responder en este momento.";
      setMessages((current) => [...current, { role: "assistant", content }]);
      if (payload.answer) speak(payload.answer);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Perdí conexión con el Director IA. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMessages((current) => [...current, { role: "assistant", content: "El dictado por voz no está disponible en este navegador." }]);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-MX";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function resetConversation() {
    window.speechSynthesis?.cancel();
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section className="futuraAssistant" aria-label="Habla con Futura">
      <header>
        <div><p>DIRECTOR IA</p><h2>Habla con Futura</h2><span>Pregunta, analiza y dirige la operación desde un solo lugar.</span></div>
        <div className="assistantTools">
          <button type="button" className={voiceReplies ? "tool active" : "tool"} onClick={() => setVoiceReplies((current) => !current)} aria-label="Activar respuestas por voz">Voz</button>
          <button type="button" className="tool" onClick={resetConversation} aria-label="Nueva conversación">Nueva</button>
          <span className="assistantStatus"><i /> Disponible</span>
        </div>
      </header>

      <div className="assistantConversation" ref={conversationRef} aria-live="polite">
        {messages.slice(-10).map((message, index) => (
          <div className={`assistantMessage ${message.role}`} key={`${message.role}-${index}-${message.content.slice(0, 12)}`}>
            {message.role === "assistant" ? <b>F</b> : null}
            <p>{message.content}</p>
          </div>
        ))}
        {loading ? <div className="assistantMessage assistant"><b>F</b><p className="thinking">Analizando el negocio…</p></div> : null}
      </div>

      <form onSubmit={send}>
        <textarea disabled={loading} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pregunta: ¿cómo está funcionando el negocio ahora?" rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        <button className={listening ? "voice listening" : "voice"} type="button" onClick={toggleVoice} aria-label="Dictar por voz">{listening ? "●" : "⌁"}</button>
        <button className="send" disabled={loading || !input.trim()} type="submit" aria-label="Enviar">↑</button>
      </form>

      <style jsx>{`
        .futuraAssistant{margin:0 0 28px;padding:26px;background:linear-gradient(145deg,#111827,#1d2940);color:#fff;border-radius:26px;box-shadow:0 24px 60px rgba(16,24,39,.16)}
        header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}header p{margin:0 0 8px;color:#9ca8bc;letter-spacing:.13em;font-size:.66rem;font-weight:800}header h2{margin:0;font-size:1.8rem;letter-spacing:-.04em}header div>span{display:block;margin-top:8px;color:#b7c0cf;font-size:.82rem}.assistantTools{display:flex;align-items:center;gap:8px}.assistantStatus{display:flex;align-items:center;gap:8px;color:#b9c4d3;font-size:.72rem;white-space:nowrap}.assistantStatus i{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.1)}.tool{height:34px;padding:0 10px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:transparent;color:#b9c4d3;font-size:.68rem}.tool.active{background:#fff;color:#111827}
        .assistantConversation{display:grid;gap:12px;min-height:190px;max-height:430px;overflow:auto;margin:24px 0;padding-right:4px}.assistantMessage{display:flex;gap:10px;align-items:flex-start;max-width:82%}.assistantMessage b{display:grid;place-items:center;flex:0 0 30px;height:30px;border-radius:10px;background:#7c5cff;font-size:.78rem}.assistantMessage p{white-space:pre-wrap;margin:0;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.08);color:#e8ecf3;font-size:.88rem;line-height:1.55}.assistantMessage.user{margin-left:auto}.assistantMessage.user p{background:#fff;color:#172033}.thinking{color:#aeb8c8!important}
        form{display:grid;grid-template-columns:minmax(0,1fr) 42px 42px;gap:8px;align-items:end;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.07)}textarea{width:100%;resize:none;min-height:42px;max-height:120px;padding:10px 12px;border:0;outline:0;background:transparent;color:#fff;font:inherit;line-height:1.4}textarea::placeholder{color:#8f9aae}textarea:disabled{opacity:.65}button{height:42px;border:0;border-radius:13px;cursor:pointer;font-weight:800}.voice{background:rgba(255,255,255,.1);color:#dbe2ec}.voice.listening{background:#ef4444;color:#fff}.send{background:#fff;color:#111827;font-size:1.1rem}.send:disabled{opacity:.35;cursor:not-allowed}
        @media(max-width:680px){.futuraAssistant{padding:19px;border-radius:22px}header{display:block}.assistantTools{margin-top:14px;flex-wrap:wrap}.assistantStatus{margin-left:auto}.assistantMessage{max-width:94%}.assistantConversation{min-height:170px}.assistantMessage p{font-size:.82rem}}
      `}</style>
    </section>
  );
}
