import Link from "next/link";
import WorkflowAction from "../components/WorkflowAction";
import { getOfferData } from "../../lib/operations";

export default async function OfertasPage() {
  const data = await getOfferData();
  return <main><nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/comercial">Agente Comercial</Link></nav><header className="agentHero"><div><p className="eyebrow">AGENTE DE OFERTAS</p><h1>Negociaciones bajo control</h1><p className="lead">Ordena ofertas abiertas, fechas límite y próximos pasos para acelerar decisiones.</p></div><span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.total} ofertas` : "Sin conexión"}</span></header><section className="panel commercialPanel"><div className="panelHeader"><div><p className="eyebrow">MESA DE NEGOCIACIÓN</p><h2>Ofertas activas</h2></div><span className="counter">{data.items.length}</span></div><div className="commercialQueue">{data.items.length ? data.items.map((item, index) => <article className="matchCard" key={item.id}><div className="matchRank">{index + 1}</div><div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.status}</span></div><p>Validar importe, condiciones, vigencia y contrapropuesta necesaria.</p><WorkflowAction title={item.name} action="Revisar oferta" priority="Alta" /></div></article>) : <p className="emptyState">No hay ofertas activas.</p>}</div></section></main>;
}
