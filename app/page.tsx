import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";
import FuturaAssistant from "./components/FuturaAssistant";
import styles from "./dashboard.module.css";

const modes = [
  { href: "/vende", icon: "＋", title: "Captar propiedad", detail: "Registrar una propiedad desde el teléfono." },
  { href: "/ventas", icon: "◆", title: "Mover una propiedad", detail: "Preparar venta, publicación y prospección." },
  { href: "/contenido", icon: "◫", title: "Crear contenido", detail: "Preparar piezas y textos por canal." },
  { href: "/seguimiento", icon: "✓", title: "Atender clientes", detail: "Resolver seguimientos y próximas acciones." },
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
  const firstPriority = dashboard.priorities[0];
  const firstInsight = dashboard.insights[0];
  const dateLabel = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>F</span><div><strong>Futura OS</strong><small>Centro operativo</small></div></div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <Link className={styles.active} href="/"><span>✦</span>Futura IA</Link>
          <Link href="/ventas"><span>◆</span>Ventas</Link>
          <Link href="/seguimiento"><span>✓</span>Clientes</Link>
          <Link href="/contenido"><span>◫</span>Contenido</Link>
          <Link href="/growth"><span>↗</span>Growth</Link>
          <Link href="/control"><span>◉</span>Control</Link>
        </nav>
        <div className={styles.sidebarFooter}><div className={`${styles.connection} ${dashboard.connected ? styles.online : ""}`}><i />{dashboard.connected ? "Datos conectados" : "Conexión pendiente"}</div></div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.commandHeader}>
          <div><div className={styles.liveLine}><span>FUTURA OS</span><i />{dateLabel}</div><h1>¿Qué quieres lograr hoy?</h1><p>Habla con Futura. El sistema reúne tus datos, agentes y herramientas y te guía con la siguiente acción.</p></div>
          <div className={styles.headerActions}><Link className={styles.primaryAction} href="/vende">＋ Captar propiedad</Link></div>
        </header>

        <section className={styles.heroGrid} aria-label="Centro de trabajo">
          <article className={`${styles.glassPanel} ${styles.aiStage}`}><div className={styles.panelLabel}><span>FUTURA IA · CENTRO DE COMANDO</span><i>Activa</i></div><FuturaAssistant metrics={dashboard.metrics} priorities={dashboard.priorities} insights={dashboard.insights} /></article>
          <aside className={styles.heroSide}>
            <article className={`${styles.glassPanel} ${styles.progressPanel}`}>
              <div className={styles.panelHeader}><div><span>PRIMERA ACCIÓN</span><h2>{firstPriority?.title ?? "Sin urgencias"}</h2></div></div>
              <p className={styles.empty}>{firstPriority?.detail ?? "Pídele a Futura que defina el mejor siguiente movimiento."}</p>
              <Link href="/seguimiento">Ver prioridades →</Link>
            </article>
            <article className={`${styles.glassPanel} ${styles.alertPanel}`}>
              <div className={styles.alertHeader}><div><span>RECOMENDACIÓN IA</span><h2>{firstInsight?.title ?? "Sistema listo"}</h2></div></div>
              <p className={styles.empty}>{firstInsight?.detail ?? "Puedes comenzar por ventas, captación o contenido."}</p>
            </article>
          </aside>
        </section>

        <div className={styles.sectionHeading}><div><span>MODOS DE TRABAJO</span><h2>Empieza por lo que estás haciendo ahora</h2></div></div>
        <section className={styles.moduleGrid} aria-label="Modos de trabajo">
          {modes.map((mode) => <Link className={styles.module} href={mode.href} key={mode.title}><span className={styles.moduleIcon}>{mode.icon}</span><div><strong>{mode.title}</strong><small>{mode.detail}</small></div><b>→</b></Link>)}
        </section>

        <section className={styles.metricGrid} aria-label="Indicadores principales">
          {dashboard.metrics.slice(0, 5).map((item, index) => <article className={styles.metricCard} key={item.label}><div className={styles.metricTop}><span>{item.label}</span><i>{String(index + 1).padStart(2, "0")}</i></div><strong>{item.value}</strong><small>{item.detail}</small><div className={styles.metricPulse}><i /><i /><i /><i /><i /><i /></div></article>)}
        </section>

        <section className={styles.operationsGrid} aria-label="Operación diaria">
          <article className={`${styles.glassPanel} ${styles.prioritiesPanel}`}><div className={styles.panelHeader}><div><span>HOY</span><h2>Qué necesita atención</h2></div><b>{dashboard.priorities.length}</b></div><div className={styles.list}>{dashboard.priorities.length ? dashboard.priorities.slice(0, 5).map((item) => <div className={styles.listItem} key={item.id}><i className={toneClass(item.tone)} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className={styles.empty}>No hay pendientes importantes.</p>}</div></article>
          <article className={`${styles.glassPanel} ${styles.insightsPanel}`}><div className={styles.panelHeader}><div><span>RESUMEN</span><h2>Negocio ahora</h2></div><b>IA</b></div><div className={styles.progressStats}><div><span>Leads</span><strong>{metric("Leads nuevos")}</strong></div><div><span>Seguimientos</span><strong>{metric("Seguimientos")}</strong></div><div><span>Coincidencias</span><strong>{metric("Coincidencias")}</strong></div></div></article>
        </section>
      </section>

      <nav className={styles.mobileDock} aria-label="Navegación móvil">
        <Link className={styles.mobileActive} href="/"><span>✦</span><small>Futura</small></Link><Link href="/ventas"><span>◆</span><small>Ventas</small></Link><Link href="/vende"><span>＋</span><small>Captar</small></Link><Link href="/seguimiento"><span>✓</span><small>Clientes</small></Link><Link href="/contenido"><span>◫</span><small>Contenido</small></Link>
      </nav>
    </main>
  );
}
