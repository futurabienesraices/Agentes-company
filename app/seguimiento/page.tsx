import Link from "next/link";
import RecordAction from "../components/RecordAction";
import { getFollowUpData } from "../../lib/operations";

export default async function SeguimientoPage() {
  const data = await getFollowUpData();
  return (
    <main>
      <nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/comercial">Agente Comercial</Link></nav>
      <header className="agentHero"><div><p className="eyebrow">AGENTE DE SEGUIMIENTO</p><h1>Que ninguna oportunidad se enfríe</h1><p className="lead">Prioriza vencidos, registra el contacto y programa la siguiente acción directamente en Airtable.</p></div><span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.overdue} vencidos` : "Sin conexión"}</span></header>
      <section className="panel commercialPanel"><div className="panelHeader"><div><p className="eyebrow">BANDEJA DE CONTACTO</p><h2>Seguimientos prioritarios</h2></div><span className="counter">{data.queue.length}</span></div><div className="commercialQueue">
        {data.queue.length ? data.queue.map((item, index) => <article className="matchCard" key={item.id}><div className="matchRank">{index + 1}</div><div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.dueAt || "Sin fecha"} · {item.status}</span></div><p>{item.nextAction}</p><div className="recordActions"><RecordAction recordId={item.id} entity="followUp" label="Marcar contactado" fields={{ status: "Completado", result: "Contactado" }} successMessage="Seguimiento completado" /><RecordAction recordId={item.id} entity="followUp" label="Reprogramar mañana" fields={{ status: "Pendiente", dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 10) }} successMessage="Seguimiento reprogramado" secondary /></div></div></article>) : <p className="emptyState">No hay seguimientos pendientes.</p>}
      </div></section>
    </main>
  );
}
