import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";
import FuturaAssistant from "./components/FuturaAssistant";
import styles from "./dashboard.module.css";

const EMPTY_MESSAGE = "No hay elementos pendientes en este bloque.";

const modules = [
  { icon: "◉", href: "/control", name: "Centro de Control", detail: "Integraciones, módulos y estado técnico.", status: "Sistema" },
  { icon: "◎", href: "/contacto", name: "Bienes Raíces", detail: "Clientes, propiedades y captación.", status: "Operación" },
  { icon: "↗", href: "/growth", name: "Growth AI", detail: "Oportunidades ordenadas por retorno.", status: "Crecimiento" },
  { icon: "◫", href: "/contenido", name: "Contenido", detail: "Campañas, carruseles, imágenes y voz.", status: "Marketing" },
  { icon: "✓", href: "/seguimiento", name: "CRM", detail: "Seguimientos y próximas acciones.", status: "Comercial" },
  { icon: "✦", href: "/director", name: "Director IA", detail: "Decisiones y coordinación del sistema.", status: "Inteligencia" },
];

const agents = [
  { href: "/growth", name: "Growth AI", detail: "ROI, monetización y ahorro", state: "Activo" },
  { href: "/", name: "Investigador", detail: "Mercado, precios y competencia", state: "Listo" },
  { href: "/", name: "Prospector", detail: "Leads y oportunidades públicas", state: "Listo" },
  { href: "/contenido", name: "Contenido", detail: "Campañas y piezas creativas", state: "Listo" },
  { href: "/seguimiento", name: "Seguimiento", detail: "Tareas y próximos contactos", state: "Listo" },
];

function toneClass(tone: string) {
  if (tone === "urgent") return styles.urgent;
  if (tone === "warning") return styles.warning;
  if (tone === "good") return styles.good;
  return styles.neutral;
}

export default async function Home() {
  const dashboard = await getDashboardData();
  const metric = (label: string) => dashboard.metrics.find((item) => item.label === label)?.value ?? 0;
  const trendMax = Math.max(1, ...dashboard.trend.map((item) => item.value));
  const weeklyTotal = dashboard.trend.reduce((sum, item) => sum + item.value, 0);
  const bestDay = dashboard.trend.reduce((best, item) => item.value > best.value ? item : best, dashboard.trend[0] ?? { label: "—", value: 0 });
  const metricClasses = [styles.metricBlue, styles.metricGreen, styles.metricAmber, styles.metricNavy, styles.metricCyan];
  const funnel = [
    { label: "Leads nuevos", value: metric("Leads nuevos") },
    { label: "Demandas activas", value: metric("Demandas activas") },
    { label: "Seguimientos", value: metric("Seguimientos") },
    { label: "Coincidencias", value: metric("Coincidencias") },
  ];
  const funnelMax = Math.max(1, ...funnel.map((item) => item.value));
  const dateLabel = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>F</span><div><strong>Futura OS</strong><small>Business Intelligence</small></div></div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <Link className={styles.active} href="/"><span className={styles.navIcon}>⌂</span>Resumen</Link>
          <Link href="/control"><span className={styles.navIcon}>◉</span>Control</Link>
          <Link href="/contacto"><span className={styles.navIcon}>◎</span>Clientes</Link>
          <Link href="/seguimiento"><span className={styles.navIcon}>✓</span>Seguimiento</Link>
          <Link href="/growth"><span className={styles.navIcon}>↗</span>Growth AI</Link>
          <Link href="/contenido"><span className={styles.navIcon}>◫</span>Contenido</Link>
          <Link href="/director"><span className={styles.navIcon}>✦</span>Director IA</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={`${styles.connection} ${dashboard.connected ? styles.online : ""}`}><i />{dashboard.connected ? "Sistema conectado" : "Conexión pendiente"}</div>
          <small>Futura OS · Panel operativo</small>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>PANEL EJECUTIVO · {dateLabel.toUpperCase()}</p>
            <h1>Todo el negocio, a primera vista.</h1>
            <p className={styles.lead}>Indicadores, prioridades, actividad y herramientas reunidas en un tablero sencillo para decidir qué hacer ahora.</p>
          </div>
          <div className={styles.topActions}>
            <span className={`${styles.statusPill} ${dashboard.connected ? styles.online : ""}`}><i />{dashboard.connected ? "Datos en vivo" : "Sin conexión"}</span>
            <Link className={styles.quickAction} href="/contenido">Crear contenido</Link>
            <Link className={`${styles.quickAction} ${styles.primary}`} href="/growth">Prioridad Growth</Link>
          </div>
        </header>

        <section className={styles.metricGrid} aria-label="Indicadores principales">
          {dashboard.metrics.slice(0, 5).map((item, index) => (
            <article className={`${styles.metricCard} ${metricClasses[index] ?? styles.metricBlue}`} key={item.label}>
              <span className={styles.metricLabel}>{item.label}</span>
              <strong className={styles.metricValue}>{item.value}</strong>
              <small className={styles.metricDetail}>{item.detail}</small>
            </article>
          ))}
        </section>

        <section className={styles.overviewGrid} aria-label="Resumen visual del negocio">
          <article className={`${styles.card} ${styles.trendCard}`}>
            <div className={styles.cardHeader}><div><p>ACTIVIDAD · 7 DÍAS</p><h2>Pulso comercial</h2></div><span>Mejor día: {bestDay.label}</span></div>
            <div className={styles.trendSummary}><strong>{weeklyTotal}</strong><span>movimientos entre leads y coincidencias</span></div>
            <div className={styles.miniBars} role="img" aria-label={`Actividad semanal total: ${weeklyTotal}`}>
              {dashboard.trend.map((item) => (
                <div className={styles.barColumn} key={item.label} title={item.detail}>
                  <strong>{item.value}</strong>
                  <i className={styles.bar} style={{ height: `${Math.max(5, Math.round((item.value / trendMax) * 100))}%` }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={`${styles.card} ${styles.funnelCard}`}>
            <div className={styles.cardHeader}><div><p>EMBUDO OPERATIVO</p><h2>Flujo comercial actual</h2></div><span>Datos de Airtable</span></div>
            <div className={styles.funnel}>
              {funnel.map((item) => (
                <div className={styles.funnelRow} key={item.label}>
                  <div className={styles.funnelMeta}><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className={styles.track}><i style={{ width: `${Math.max(item.value ? 8 : 0, Math.round((item.value / funnelMax) * 100))}%` }} /></div>
                </div>
              ))}
            </div>
          </article>

          <article className={`${styles.card} ${styles.prioritiesCard}`}>
            <div className={styles.cardHeader}><div><p>ACCIÓN INMEDIATA</p><h2>Prioridades de hoy</h2></div><span className={styles.counter}>{dashboard.priorities.length}</span></div>
            <div className={styles.list}>
              {dashboard.priorities.length ? dashboard.priorities.slice(0, 6).map((item) => (
                <div className={styles.listItem} key={item.id}><i className={toneClass(item.tone)} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>→</b></div>
              )) : <p className={styles.empty}>{EMPTY_MESSAGE}</p>}
            </div>
          </article>

          <article className={`${styles.card} ${styles.insightsCard}`}>
            <div className={styles.cardHeader}><div><p>DIRECTOR IA</p><h2>Decisiones sugeridas</h2></div><span className={`${styles.counter} ${styles.darkCounter}`}>IA</span></div>
            <div className={styles.insightList}>
              {dashboard.insights.slice(0, 4).map((item) => <div className={`${styles.insight} ${toneClass(item.tone)}`} key={item.id}><strong>{item.title}</strong><p>{item.detail}</p></div>)}
            </div>
          </article>

          <article className={`${styles.card} ${styles.activityCard}`}>
            <div className={styles.cardHeader}><div><p>ACTIVIDAD RECIENTE</p><h2>Qué se movió</h2></div><span>Últimos registros</span></div>
            <div className={styles.timeline}>
              {dashboard.recent.length ? dashboard.recent.slice(0, 6).map((item) => <div className={styles.timelineItem} key={item.id}><i /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className={styles.empty}>Todavía no hay actividad reciente.</p>}
            </div>
          </article>

          <article className={`${styles.card} ${styles.agentsCard}`}>
            <div className={styles.cardHeader}><div><p>EQUIPO DE CRECIMIENTO</p><h2>Agentes disponibles</h2></div><Link href="/growth">Ver backlog</Link></div>
            <div className={styles.agentList}>
              {agents.map((agent) => <Link className={styles.agent} href={agent.href} key={agent.name}><i /><div><strong>{agent.name}</strong><small>{agent.detail}</small></div><em>{agent.state}</em></Link>)}
            </div>
          </article>
        </section>

        <div className={styles.sectionHeading}><div><p>ASISTENTE CENTRAL</p><h2>Habla con el Director IA</h2></div><span>Investiga, crea y ejecuta con confirmación.</span></div>
        <section className={styles.assistantWrap}><FuturaAssistant metrics={dashboard.metrics} priorities={dashboard.priorities} insights={dashboard.insights} /></section>

        <div className={styles.sectionHeading}><div><p>HERRAMIENTAS</p><h2>Accesos rápidos</h2></div><span>{modules.length} módulos conectados</span></div>
        <section className={styles.moduleGrid} aria-label="Módulos de Futura OS">
          {modules.map((item) => (
            <Link className={styles.module} href={item.href} key={item.name}>
              <span className={styles.moduleIcon}>{item.icon}</span>
              <div><strong>{item.name}</strong><small>{item.detail}</small><span className={styles.moduleStatus}>{item.status}</span></div>
              <b>→</b>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
