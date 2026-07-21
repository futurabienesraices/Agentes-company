import Link from "next/link";
import CommercialAction from "../components/CommercialAction";
import { getCommercialData } from "../../lib/agents";

export default async function ComercialPage() {
  const data = await getCommercialData();

  return (
    <main>
      <nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/captador">Agente Captador</Link></nav>
      <header className="agentHero">
        <div><p className="eyebrow">AGENTE COMERCIAL</p><h1>Prioridad comercial y seguimiento</h1><p className="lead">Ordena las mejores coincidencias y convierte oportunidades en tareas concretas para el equipo.</p></div>
        <span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.activeDemands} demandas activas` : "Sin conexión"}</span>
      </header>

      <section className="panel commercialPanel">
        <div className="panelHeader"><div><p className="eyebrow">SIGUIENTE MEJOR ACCIÓN</p><h2>Cola de oportunidades</h2></div><span className="counter">{data.queue.length}</span></div>
        <div className="commercialQueue">
          {data.queue.length ? data.queue.map((item, index) => (
            <article className="matchCard" key={item.id}>
              <div className="matchRank">{index + 1}</div>
              <div className="matchContent"><div className="matchTitle"><strong>{item.name}</strong><span>{item.score} pts · {item.level}</span></div>{item.reasons ? <p>{item.reasons}</p> : null}{item.alerts ? <small>{item.alerts}</small> : null}<CommercialAction matchName={item.name} /></div>
            </article>
          )) : <p className="emptyState">No hay coincidencias comerciales pendientes.</p>}
        </div>
      </section>
    </main>
  );
}
