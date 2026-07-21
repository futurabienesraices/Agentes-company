import Link from "next/link";
import WorkflowAction from "../components/WorkflowAction";
import { getPublicationData } from "../../lib/operations";

export default async function PublicacionesPage() {
  const data = await getPublicationData();
  return <main><nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/captador">Agente Captador</Link></nav><header className="agentHero"><div><p className="eyebrow">AGENTE DE PUBLICACIONES</p><h1>Contenido listo para salir</h1><p className="lead">Organiza borradores, piezas pendientes y próximas publicaciones por prioridad.</p></div><span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.total} publicaciones` : "Sin conexión"}</span></header><section className="panel commercialPanel"><div className="panelHeader"><div><p className="eyebrow">COLA EDITORIAL</p><h2>Publicaciones en proceso</h2></div><span className="counter">{data.items.length}</span></div><div className="commercialQueue">{data.items.length ? data.items.map((item, index) => <article className="matchCard" key={item.id}><div className="matchRank">{index + 1}</div><div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.status}</span></div><p>Preparar copy, material visual, canal y llamada a la acción.</p><WorkflowAction title={item.name} action="Preparar publicación" priority="Media" /></div></article>) : <p className="emptyState">No hay publicaciones pendientes.</p>}</div></section></main>;
}
