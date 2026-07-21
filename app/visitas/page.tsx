import Link from "next/link";
import WorkflowAction from "../components/WorkflowAction";
import { getVisitData } from "../../lib/operations";

export default async function VisitasPage() {
  const data = await getVisitData();
  return <main><nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/seguimiento">Agente de Seguimiento</Link></nav><header className="agentHero"><div><p className="eyebrow">AGENTE DE VISITAS</p><h1>Agenda, confirma y recupera cada visita</h1><p className="lead">Centraliza las visitas abiertas y crea acciones para confirmar, preparar y registrar resultados.</p></div><span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.total} visitas` : "Sin conexión"}</span></header><section className="panel commercialPanel"><div className="panelHeader"><div><p className="eyebrow">AGENDA OPERATIVA</p><h2>Visitas abiertas</h2></div><span className="counter">{data.items.length}</span></div><div className="commercialQueue">{data.items.length ? data.items.map((item, index) => <article className="matchCard" key={item.id}><div className="matchRank">{index + 1}</div><div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.status}</span></div><p>Confirmar cliente, propiedad, horario y responsable. Registrar resultado al finalizar.</p><WorkflowAction title={item.name} action="Confirmar visita" priority="Alta" /></div></article>) : <p className="emptyState">No hay visitas abiertas.</p>}</div></section></main>;
}
