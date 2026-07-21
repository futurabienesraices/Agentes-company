import Link from "next/link";
import WorkflowAction from "../components/WorkflowAction";
import { getFollowUpData } from "../../lib/operations";

export default async function SeguimientoPage() {
  const data = await getFollowUpData();
  return (
    <main>
      <nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/comercial">Agente Comercial</Link></nav>
      <header className="agentHero"><div><p className="eyebrow">AGENTE DE SEGUIMIENTO</p><h1>Que ninguna oportunidad se enfríe</h1><p className="lead">Prioriza vencidos, propone la siguiente acción y crea tareas de contacto para hoy.</p></div><span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.overdue} vencidos` : "Sin conexión"}</span></header>
      <section className="panel commercialPanel"><div className="panelHeader"><div><p className="eyebrow">BANDEJA DE CONTACTO</p><h2>Seguimientos prioritarios</h2></div><span className="counter">{data.queue.length}</span></div><div className="commercialQueue">
        {data.queue.length ? data.queue.map((item, index) => <article className="matchCard" key={item.id}><div className="matchRank">{index + 1}</div><div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.dueAt || "Sin fecha"} · {item.status}</span></div><p>{item.nextAction}</p><WorkflowAction title={item.name} action={item.nextAction} priority={item.tone === "urgent" ? "Alta" : "Media"} dueAt={item.dueAt} /></div></article>) : <p className="emptyState">No hay seguimientos pendientes.</p>}
      </div></section>
    </main>
  );
}
