"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

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

function metricValue(metrics: Metric[], label: string) {
  return metrics.find((item) => item.label.toLowerCase().includes(label.toLowerCase()))?.value ?? 0;
}

export default function FuturaAssistant({ metrics, priorities, insights }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Estoy listo. Pregúntame cómo va el negocio, qué requiere atención o qué oportunidad conviene mover primero." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const summary = useMemo(() => {
    const leads = metricValue(metrics, "Leads");
    const properties = metricValue(metrics, "Propiedades");
    const followUps = metricValue(metrics, "Seguimientos");
    const matches = metricValue(metrics, "Coincidencias");
    return { leads, properties, followUps, matches };
  }, [metrics]);

  function answerFor(prompt: string) {
    const text = prompt.toLowerCase();
    if (text.includes("cómo") || text.includes("como") || text.includes("estado") || text.includes("negocio")) {
      return `El negocio tiene ${summary.properties} propiedades activas, ${summary.leads} leads nuevos, ${summary.followUps} seguimientos pendientes y ${summary.matches} coincidencias comerciales. ${priorities.length ? `Hay ${priorities.length} acciones que requieren atención inmediata.` : "No hay bloqueos críticos visibles."}`;
    }
    if (text.includes("qué hago") || text.includes("que hago") || text.includes("prioridad") || text.includes("necesito hacer")) {
      if (!priorities.length) return "No veo tareas críticas ahora. Conviene revisar coincidencias fuertes y mantener el seguimiento de los leads recientes.";
      return `Primero atendería: ${priorities.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}: ${item.detail}`).join(" ")}`;
    }
    if (text.includes("lead") || text.includes("cliente")) {
      return `Hay ${summary.leads} leads nuevos. ${priorities.filter((item) => item.detail.toLowerCase().includes("lead")).length} aparecen dentro de las prioridades actuales. La siguiente acción es responder, clasificar y crear seguimiento para los de mayor intención.`;
    }
    if (text.includes("propiedad") || text.includes("inmueble")) {
      return `Hay ${summary.properties} propiedades activas. Para atraer demanda, cada propiedad debe tener ficha completa, público objetivo, contenido, canales de captación y seguimiento automático de cada lead generado.`;
    }
    if (text.includes("recomend") || text.includes("oportunidad")) {
      return insights[0]?.title ? `${insights[0].title}. ${insights[0].detail}` : "Todavía no hay una recomendación prioritaria disponible.";
    }
    return "Puedo ayudarte a revisar el estado del negocio, prioridades, leads, propiedades, seguimientos y oportunidades. La ejecución automática se conectará a los agentes conforme activemos cada herramienta.";
  }

  function send(event?: FormEvent) {
    event?.preventDefault();
    const value = input.trim();
    if (!value) return;
    const reply = answerFor(value);
    setMessages((current) => [...current, { role: "user", content: value }, { role: "assistant", content: reply }]);
    setInput("");
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

  return (
    <section className="futuraAssistant" aria-label="Habla con Futura">
      <header>
        <div><p>DIRECTOR IA</p><h2>Habla con Futura</h2><span>Pregunta, analiza y dirige la operación desde un solo lugar.</span></div>
        <span className="assistantStatus"><i /> Disponible</span>
      </header>

      <div className="assistantConversation" aria-live="polite">
        {messages.slice(-5).map((message, index) => (
          <div className={`assistantMessage ${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" ? <b>F</b> : null}
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={send}>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pregunta: ¿cómo está funcionando el negocio ahora?" rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        <button className={listening ? "voice listening" : "voice"} type="button" onClick={toggleVoice} aria-label="Dictar por voz">{listening ? "●" : "⌁"}</button>
        <button className="send" type="submit" aria-label="Enviar">↑</button>
      </form>

      <style jsx>{`
        .futuraAssistant{margin:0 0 28px;padding:26px;background:linear-gradient(145deg,#111827,#1d2940);color:#fff;border-radius:26px;box-shadow:0 24px 60px rgba(16,24,39,.16)}
        header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start}header p{margin:0 0 8px;color:#9ca8bc;letter-spacing:.13em;font-size:.66rem;font-weight:800}header h2{margin:0;font-size:1.8rem;letter-spacing:-.04em}header div>span{display:block;margin-top:8px;color:#b7c0cf;font-size:.82rem}.assistantStatus{display:flex;align-items:center;gap:8px;color:#b9c4d3;font-size:.72rem}.assistantStatus i{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.1)}
        .assistantConversation{display:grid;gap:12px;min-height:170px;max-height:360px;overflow:auto;margin:24px 0}.assistantMessage{display:flex;gap:10px;align-items:flex-start;max-width:82%}.assistantMessage b{display:grid;place-items:center;flex:0 0 30px;height:30px;border-radius:10px;background:#7c5cff;font-size:.78rem}.assistantMessage p{margin:0;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.08);color:#e8ecf3;font-size:.88rem;line-height:1.55}.assistantMessage.user{margin-left:auto}.assistantMessage.user p{background:#fff;color:#172033}
        form{display:grid;grid-template-columns:minmax(0,1fr) 42px 42px;gap:8px;align-items:end;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.07)}textarea{width:100%;resize:none;min-height:42px;max-height:120px;padding:10px 12px;border:0;outline:0;background:transparent;color:#fff;font:inherit;line-height:1.4}textarea::placeholder{color:#8f9aae}button{height:42px;border:0;border-radius:13px;cursor:pointer;font-weight:800}.voice{background:rgba(255,255,255,.1);color:#dbe2ec}.voice.listening{background:#ef4444;color:#fff}.send{background:#fff;color:#111827;font-size:1.1rem}
        @media(max-width:680px){.futuraAssistant{padding:19px;border-radius:22px}header{display:block}.assistantStatus{margin-top:12px}.assistantMessage{max-width:94%}.assistantConversation{min-height:150px}.assistantMessage p{font-size:.82rem}}
      `}</style>
    </section>
  );
}
