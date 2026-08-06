import Link from "next/link";
import type { CSSProperties } from "react";
import { getDashboardData } from "../lib/dashboard";
import FuturaAssistant from "./components/FuturaAssistant";
import styles from "./dashboard.module.css";

const EMPTY_MESSAGE = "No hay elementos pendientes en este bloque.";

const modules = [
  { icon: "◉", href: "/control", name: "Centro de Control", detail: "Integraciones, módulos y estado técnico.", status: "Sistema" },
  { icon: "◎", href: "/contacto", name: "Bienes Raíces", detail: "Clientes, propiedades y captación.", status: "Operación" },
  { icon: "◆", href: "/ventas", name: "Equipo de Ventas", detail: "Publicación, prospección y seguimiento diario.", status: "Ventas" },
  { icon: "↗", href: "/growth", name: "Growth AI", detail: "Oportunidades ordenadas por retorno.", status: "Crecimiento" },
  { icon: "◫", href: "/contenido", name: "Contenido", detail: "Campañas, carruseles, imágenes y voz.", status: "Marketing" },
  { icon: "✓", href: "/seguimiento", name: "CRM", detail: "Seguimientos y próximas acciones.", status: "Comercial" },
  { icon: "✦", href: "/director", name: "Director IA", detail: "Decisiones y coordinación del sistema.", status: "Inteligencia" },
];

const agents = [
  { href: "/growth", name: "Growth AI", detail: "ROI, monetización y ahorro", state: "Activo" },
  { href: "/ventas", name: "Equipo de Ventas", detail: "Captación, publicación y prospección", state: "Activo" },
  { href: "/", name: "Investigador", detail: "Mercado, precios y competencia", state: "Listo" },
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
  const urgentCount = dashboard.priorities.filter((item) => item.tone === "urgent" || item.tone === "warning").length;
  const operationalRate = Math.round((weeklyTotal / Math.max(1, weeklyTotal + dashboard.priorities.length)) * 100);
  const progressStyle = { "--progress": `${operationalRate * 3.6}deg` } as CSSProperties & { "--progress": string };
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
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>F</span>
          <div><strong>Futura OS</strong><small>Growth Intelligence</small></div>
        </div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <Link className={styles.active} href="/"><span className={styles.navIcon}>⌂</span>Centro global</Link>
          <Link href="/control"><span className={styles.navIcon}>◉</span>Control</Link>
          <Link href="/contacto"><span className={styles.navIcon}>◎</span>Clientes</Link>
          <Link href="/ventas"><span className={styles.navIcon}>◆</span>Ventas</Link>
          <Link href="/seguimiento"><span className={styles.navIcon}>✓</span>Seguimiento</Link>
          <Link href="/growth"><span className={styles.navIcon}>↗</span>Growth AI</Link>
          <Link href="/contenido"><span className={styles.navIcon}>◫</span>Contenido</Link>
          <Link href="/director"><span className={styles.navIcon}>✦</span>Director IA</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={`${styles.connection} ${dashboard.connected ? styles.online : ""}`}><i />{dashboard.connected ? "Sistema conectado" : "Conexión pendiente"}</div>
          <small>Futura OS · Operación inmobiliaria</small>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.commandHeader}>
          <div>
            <div className={styles.liveLine}><span>FUTURA OS</span><i />{dashboard.connected ? "DATOS EN VIVO" : "MODO SIN CONEXIÓN"}</div>
            <h1>Centro de análisis global</h1>
            <p>Habla con la IA, detecta oportunidades y controla la operación comercial desde una sola pantalla.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.datePill}>{dateLabel}</span>
            <Link href="/ventas">Abrir ventas</Link>
            <Link className={styles.primaryAction} href="/contenido">Crear contenido</Link>
          </div>
        </header>

        <section className={styles.heroGrid} aria-label="Comando principal">
          <article className={`${styles.glassPanel} ${styles.aiStage}`}>
            <div className={styles.panelLabel}><span>INTERFAZ CENTRAL</span><i>IA activa</i></div>
            <FuturaAssistant metrics={dashboard.metrics} priorities={dashboard.priorities} insights={dashboard.insights} />
          </article>

          <aside className={styles.heroSide}>
            <article className={`${styles.glassPanel} ${styles.progressPanel}`}>
              <div className={styles.panelHeader}>
                <div><span>PROGRESO OPERATIVO</span><h2>Actividad atendida</h2></div>
                <b>{weeklyTotal} mov.</b>
              </div>
              <div className={styles.progressCore}>
                <div className={styles.progressRing} style={progressStyle}><div><strong>{operationalRate}%</strong><small>procesado</small></div></div>
                <div className={styles.progressStats}>
                  <div><span>Mejor día</span><strong>{bestDay.label}</strong></div>
                  <div><span>Pendientes</span><strong>{dashboard.priorities.length}</strong></div>
                  <div><span>Agentes</span><strong>{agents.length}</strong></div>
                </div>
              </div>
            </article>

            <article className={`${styles.glassPanel} ${styles.alertPanel}`}>
              <div className={styles.alertHeader}><div><span>PROBLEMAS ABIERTOS</span><h2>Requieren revisión</h2></div><strong>{urgentCount}</strong></div>
              <div className={styles.alertList}>
                {dashboard.priorities.length ? dashboard.priorities.slice(0, 4).map((item) => (
                  <div key={item.id}><i className={toneClass(item.tone)} /><p><strong>{item.title}</strong><span>{item.detail}</span></p></div>
                )) : <p className={styles.empty}>Sin alertas abiertas.</p>}
              </div>
              <Link href="/seguimiento">Resolver prioridades →</Link>
            </article>
          </aside>
        </section>

        <section className={styles.metricGrid} aria-label="Indicadores principales">
          {dashboard.metrics.slice(0, 5).map((item, index) => (
            <article className={styles.metricCard} key={item.label}>
              <div className={styles.metricTop}><span>{item.label}</span><i>{String(index + 1).padStart(2, "0")}</i></div>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
              <div className={styles.metricPulse}><i /><i /><i /><i /><i /><i /></div>
            </article>
          ))}
        </section>

        <section className={styles.analysisGrid} aria-label="Análisis comercial">
          <article className={`${styles.glassPanel} ${styles.trendPanel}`}>
            <div className={styles.panelHeader}><div><span>FLUJO DE OPERACIONES</span><h2>Actividad de los últimos siete días</h2></div><b>{weeklyTotal} eventos</b></div>
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

          <article className={`${styles.glassPanel} ${styles.funnelPanel}`}>
            <div className={styles.panelHeader}><div><span>EMBUDO COMERCIAL</span><h2>Flujo actual</h2></div><b>Airtable</b></div>
            <div className={styles.funnel}>
              {funnel.map((item) => (
                <div className={styles.funnelRow} key={item.label}>
                  <div><span>{item.label}</span><strong>{item.value}</strong></div>
                  <div className={styles.track}><i style={{ width: `${Math.max(item.value ? 8 : 0, Math.round((item.value / funnelMax) * 100))}%` }} /></div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.operationsGrid} aria-label="Operación diaria">
          <article className={`${styles.glassPanel} ${styles.prioritiesPanel}`}>
            <div className={styles.panelHeader}><div><span>ACCIÓN INMEDIATA</span><h2>Prioridades de hoy</h2></div><b>{dashboard.priorities.length}</b></div>
            <div className={styles.list}>
              {dashboard.priorities.length ? dashboard.priorities.slice(0, 6).map((item) => (
                <div className={styles.listItem} key={item.id}><i className={toneClass(item.tone)} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><b>→</b></div>
              )) : <p className={styles.empty}>{EMPTY_MESSAGE}</p>}
            </div>
          </article>

          <article className={`${styles.glassPanel} ${styles.insightsPanel}`}>
            <div className={styles.panelHeader}><div><span>DIRECTOR IA</span><h2>Decisiones sugeridas</h2></div><b>IA</b></div>
            <div className={styles.insightList}>
              {dashboard.insights.slice(0, 4).map((item) => <div className={`${styles.insight} ${toneClass(item.tone)}`} key={item.id}><strong>{item.title}</strong><p>{item.detail}</p></div>)}
            </div>
          </article>

          <article className={`${styles.glassPanel} ${styles.activityPanel}`}>
            <div className={styles.panelHeader}><div><span>ACTIVIDAD RECIENTE</span><h2>Qué se movió</h2></div><b>En vivo</b></div>
            <div className={styles.timeline}>
              {dashboard.recent.length ? dashboard.recent.slice(0, 6).map((item) => <div className={styles.timelineItem} key={item.id}><i /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className={styles.empty}>Todavía no hay actividad reciente.</p>}
            </div>
          </article>

          <article className={`${styles.glassPanel} ${styles.agentsPanel}`}>
            <div className={styles.panelHeader}><div><span>EQUIPO DIGITAL</span><h2>Agentes disponibles</h2></div><Link href="/ventas">Abrir</Link></div>
            <div className={styles.agentList}>
              {agents.map((agent) => <Link className={styles.agent} href={agent.href} key={agent.name}><i /><div><strong>{agent.name}</strong><small>{agent.detail}</small></div><em>{agent.state}</em></Link>)}
            </div>
          </article>
        </section>

        <div className={styles.sectionHeading}><div><span>HERRAMIENTAS CONECTADAS</span><h2>Accesos rápidos</h2></div><small>{modules.length} módulos listos</small></div>
        <section className={styles.moduleGrid} aria-label="Módulos de Futura OS">
          {modules.map((item) => (
            <Link className={styles.module} href={item.href} key={item.name}>
              <span className={styles.moduleIcon}>{item.icon}</span>
              <div><strong>{item.name}</strong><small>{item.detail}</small><em>{item.status}</em></div>
              <b>→</b>
            </Link>
          ))}
        </section>
      </section>

      <nav className={styles.mobileDock} aria-label="Navegación móvil">
        <Link className={styles.mobileActive} href="/"><span>⌂</span><small>Inicio</small></Link>
        <Link href="/ventas"><span>◆</span><small>Ventas</small></Link>
        <Link href="/contenido"><span>◫</span><small>Contenido</small></Link>
        <Link href="/growth"><span>↗</span><small>Growth</small></Link>
        <Link href="/director"><span>✦</span><small>IA</small></Link>
      </nav>
    </main>
  );
}
