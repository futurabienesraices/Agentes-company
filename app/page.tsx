import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";
import VisualDataView from "./components/VisualDataView";

const EMPTY_MESSAGE = "No hay elementos pendientes en este bloque.";

const apps = [
  { icon: "◉", href: "/control", name: "Centro de Control", detail: "Estado del kernel, módulos e integraciones de Futura OS.", status: "Nueva" },
  { icon: "⌂", href: "/contacto", name: "Bienes Raíces", detail: "Clientes, propiedades y captación comercial.", status: "Activa" },
  { icon: "✦", href: "/director", name: "Director IA", detail: "Coordina prioridades y decisiones del sistema.", status: "Activa" },
  { icon: "◎", href: "/seguimiento", name: "CRM", detail: "Seguimientos, oportunidades y próximos contactos.", status: "Activa" },
  { icon: "◇", href: "/publicaciones", name: "Contenido", detail: "Publicaciones y distribución de propiedades.", status: "Beta" },
  { icon: "◫", href: "/visitas", name: "Agenda", detail: "Visitas, confirmaciones y resultados.", status: "Beta" },
  { icon: "+", href: "/captador", name: "Servicios Futura", detail: "Nueva aplicación conectada al núcleo de Futura OS.", status: "Próxima" },
];

const agents = [
  { href: "/captador", name: "Captador", detail: "Propiedades y fichas", state: "Listo" },
  { href: "/comercial", name: "Comercial", detail: "Coincidencias y oportunidades", state: "Listo" },
  { href: "/seguimiento", name: "Seguimiento", detail: "Tareas y contactos", state: "Listo" },
  { href: "/publicaciones", name: "Publicaciones", detail: "Contenido inmobiliario", state: "Beta" },
];

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <main className="osShell">
      <aside className="osSidebar">
        <div className="osBrand"><span>F</span><div><strong>Futura OS</strong><small>Business Intelligence</small></div></div>
        <nav className="osNav" aria-label="Navegación principal">
          <Link className="active" href="/">⌂ <span>Inicio</span></Link>
          <Link href="/control">◉ <span>Control</span></Link>
          <Link href="/contacto">◎ <span>Clientes</span></Link>
          <Link href="/seguimiento">✓ <span>Tareas</span></Link>
          <Link href="/director">✦ <span>Inteligencia</span></Link>
        </nav>
        <div className="osSidebarFooter">
          <div className={`osConnection ${dashboard.connected ? "online" : "offline"}`}><span />{dashboard.connected ? "Sistema conectado" : "Conexión pendiente"}</div>
          <small>Futura OS · Alpha</small>
        </div>
      </aside>

      <section className="osWorkspace">
        <header className="osTopbar">
          <div><p className="eyebrow">CENTRO DE OPERACIONES</p><h1>Buenos días.</h1><p className="lead">Aquí tienes el estado actual de Futura y las decisiones que requieren atención.</p></div>
          <div className="osTopActions"><Link className="osQuickButton" href="/control">Abrir control</Link><div className="osAvatar">F</div></div>
        </header>

        <section className="osMetricGrid" aria-label="Resumen operativo">
          {dashboard.metrics.map((metric, index) => <article className={`osMetricCard metric-${index + 1}`} key={metric.label}><div><span>{metric.label}</span><strong>{metric.value}</strong></div><small>{metric.detail}</small></article>)}
        </section>

        <section style={{ marginBottom: 28 }}>
          <VisualDataView eyebrow="PANORAMA OPERATIVO" title="Indicadores del negocio" description="Cambia entre gráfico y tabla para interpretar o revisar los valores exactos." data={dashboard.metrics.map((metric) => ({ label: metric.label, value: metric.value, detail: metric.detail }))} />
        </section>

        <section className="osSectionHeader"><div><p className="eyebrow">APLICACIONES</p><h2>Tu espacio de trabajo</h2></div><span>{apps.length} módulos</span></section>
        <section className="osAppGrid" aria-label="Aplicaciones de Futura OS">
          {apps.map((app) => <Link className="osAppCard" href={app.href} key={app.name}><div className="osAppIcon">{app.icon}</div><div className="osAppCopy"><div><strong>{app.name}</strong><span>{app.status}</span></div><p>{app.detail}</p></div><b>→</b></Link>)}
        </section>

        <section className="osDashboardGrid">
          <article className="osPanel osPriorities">
            <div className="osPanelHeader"><div><p className="eyebrow">ACCIÓN INMEDIATA</p><h2>Prioridades de hoy</h2></div><span className="osCounter">{dashboard.priorities.length}</span></div>
            <div className="osList">{dashboard.priorities.length ? dashboard.priorities.map((item) => <div className="osListItem" key={item.id}><span className={`signal ${item.tone}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>→</b></div>) : <p className="emptyState">{EMPTY_MESSAGE}</p>}</div>
          </article>

          <article className="osPanel osIntelligence">
            <div className="osPanelHeader"><div><p className="eyebrow">INTELIGENCIA</p><h2>Decisiones sugeridas</h2></div><span className="osAiBadge">IA</span></div>
            <div className="osInsightList">{dashboard.insights.map((item) => <div className={`osInsight ${item.tone}`} key={item.id}><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div>
          </article>

          <article className="osPanel osAgents">
            <div className="osPanelHeader"><div><p className="eyebrow">EQUIPO DIGITAL</p><h2>Agentes</h2></div><Link href="/director">Ver director</Link></div>
            <div className="osAgentList">{agents.map((agent) => <Link href={agent.href} key={agent.name}><span className="osAgentPulse" /><div><strong>{agent.name}</strong><small>{agent.detail}</small></div><em>{agent.state}</em></Link>)}</div>
          </article>

          <article className="osPanel osActivity">
            <div className="osPanelHeader"><div><p className="eyebrow">ACTIVIDAD</p><h2>Movimiento reciente</h2></div></div>
            <div className="osTimeline">{dashboard.recent.length ? dashboard.recent.map((item) => <div className="osTimelineItem" key={item.id}><span className={`signal ${item.tone}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className="emptyState">Todavía no hay actividad reciente.</p>}</div>
          </article>
        </section>
      </section>
    </main>
  );
}
