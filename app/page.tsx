import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";
import FuturaAssistant from "./components/FuturaAssistant";
import styles from "./dashboard.module.css";

export default async function Home() {
  const dashboard = await getDashboardData();
  const firstPriority = dashboard.priorities[0];
  const firstInsight = dashboard.insights[0];

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>F</span><div><strong>Futura OS</strong><small>Centro operativo</small></div></div>
        <nav className={styles.nav} aria-label="Navegacion principal">
          <Link className={styles.active} href="/"><span>⌂</span>Inicio</Link>
          <details><summary>◆ Operacion</summary><div><Link href="/vende">Captar propiedad</Link><Link href="/ventas">Ventas</Link><Link href="/seguimiento">Clientes</Link><Link href="/contenido">Contenido</Link></div></details>
          <details><summary>◫ Analisis</summary><div><Link href="/control">Panel general</Link><Link href="/growth">Growth AI</Link></div></details>
          <details><summary>✦ Agentes</summary><div><Link href="/director">Director IA</Link><Link href="/ventas">Equipo de ventas</Link><Link href="/growth">Growth AI</Link></div></details>
          <details><summary>⚙ Sistema</summary><div><Link href="/control">Centro de control</Link></div></details>
        </nav>
        <div className={styles.sidebarFooter}><div className={`${styles.connection} ${dashboard.connected ? styles.online : ""}`}><i />{dashboard.connected ? "Datos conectados" : "Conexion pendiente"}</div></div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.commandHeader}>
          <div><div className={styles.liveLine}><span>FUTURA OS</span><i />CENTRO DE TRABAJO</div><h1>¿Que quieres lograr hoy?</h1><p>Habla con Futura y usa los menus solo cuando necesites entrar a una funcion especifica.</p></div>
          <div className={styles.headerActions}><Link className={styles.primaryAction} href="/vende">＋ Captar</Link></div>
        </header>

        <section className={styles.heroGrid}>
          <article className={`${styles.glassPanel} ${styles.aiStage}`}><div className={styles.panelLabel}><span>FUTURA IA</span><i>Activa</i></div><FuturaAssistant metrics={dashboard.metrics} priorities={dashboard.priorities} insights={dashboard.insights} /></article>
          <aside className={styles.heroSide}>
            <article className={`${styles.glassPanel} ${styles.progressPanel}`}><div className={styles.panelHeader}><div><span>SIGUIENTE ACCION</span><h2>{firstPriority?.title ?? "Sin urgencias"}</h2></div></div><p className={styles.empty}>{firstPriority?.detail ?? "Pidele a Futura el mejor siguiente movimiento."}</p><Link href="/seguimiento">Abrir pendientes →</Link></article>
            <article className={`${styles.glassPanel} ${styles.alertPanel}`}><div className={styles.alertHeader}><div><span>RECOMENDACION IA</span><h2>{firstInsight?.title ?? "Sistema listo"}</h2></div></div><p className={styles.empty}>{firstInsight?.detail ?? "Puedes comenzar por captacion, ventas o contenido."}</p></article>
          </aside>
        </section>

        <section className={styles.metricGrid} aria-label="Resumen del negocio">{dashboard.metrics.slice(0,4).map((item) => <Link href="/control" className={styles.metricCard} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></Link>)}</section>
      </section>

      <nav className={styles.mobileDock}><Link className={styles.mobileActive} href="/"><span>⌂</span><small>Inicio</small></Link><Link href="/ventas"><span>◆</span><small>Ventas</small></Link><Link href="/vende"><span>＋</span><small>Captar</small></Link><Link href="/control"><span>◫</span><small>Paneles</small></Link><Link href="/director"><span>✦</span><small>IA</small></Link></nav>
    </main>
  );
}
