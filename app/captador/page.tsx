import Link from "next/link";
import PropertyForm from "../components/PropertyForm";
import { getCaptadorData } from "../../lib/agents";

export default async function CaptadorPage() {
  const data = await getCaptadorData();

  return (
    <main>
      <nav className="agentNav"><Link href="/">← Centro de operaciones</Link><Link href="/comercial">Agente Comercial</Link></nav>
      <header className="agentHero">
        <div><p className="eyebrow">AGENTE CAPTADOR</p><h1>Captación y calidad de propiedades</h1><p className="lead">Registra inmuebles, detecta información faltante y prepara cada ficha para comercialización.</p></div>
        <span className={`systemStatus ${data.connected ? "online" : "offline"}`}><span className="dot" />{data.connected ? `${data.total} propiedades` : "Sin conexión"}</span>
      </header>

      <section className="agentGrid">
        <article className="panel"><div className="panelHeader"><div><p className="eyebrow">NUEVA CAPTACIÓN</p><h2>Crear propiedad</h2></div></div><PropertyForm /></article>
        <article className="panel"><div className="panelHeader"><div><p className="eyebrow">CONTROL DE CALIDAD</p><h2>Fichas incompletas</h2></div><span className="counter">{data.incomplete.length}</span></div>
          <div className="itemList">{data.incomplete.length ? data.incomplete.map((item) => <div className="actionItem" key={item.id}><span className="signal warning" /><div><strong>{item.name}</strong><p>{item.missing}</p><small>{item.preparation}</small></div></div>) : <p className="emptyState">No hay propiedades incompletas.</p>}</div>
        </article>
      </section>
    </main>
  );
}
