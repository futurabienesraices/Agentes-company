import Link from "next/link";
import HomeCommandBar from "./components/HomeCommandBar";
import HomeModules from "./components/HomeModules";
import { getDashboardData } from "../lib/dashboard";
import styles from "./home.module.css";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>F</span><div><strong>Futura OS</strong><small>Centro operativo</small></div></div>
        <nav className={styles.nav} aria-label="Navegación principal">
          <Link className={styles.active} href="/">⌂ Inicio</Link>
          <Link href="/ventas">◆ Propiedades</Link>
          <Link href="/seguimiento">◎ CRM</Link>
          <Link href="/control">▥ Gráficos</Link>
          <Link href="/director">✦ Agentes</Link>
          <Link href="/growth">↗ Growth</Link>
          <Link href="/contenido">◫ Contenido</Link>
          <Link href="/vende">＋ Captar</Link>
        </nav>
        <div className={styles.sidebarFooter}>{dashboard.connected ? "● Datos conectados" : "● Conexión pendiente"}</div>
      </aside>

      <section className={styles.main}>
        <div className={styles.content}>
          <header className={styles.appBar}>
            <div><strong>Futura OS</strong><span>Tu centro de trabajo</span></div>
            <span className={dashboard.connected ? styles.connectionLive : styles.connectionPending}>
              {dashboard.connected ? "IA y datos activos" : "Datos pendientes"}
            </span>
          </header>

          <section className={styles.aiArea} aria-label="Conversación con Futura IA">
            <HomeCommandBar context={{ metrics: dashboard.metrics, priorities: dashboard.priorities, insights: dashboard.insights }} />
          </section>

          <HomeModules
            connected={dashboard.connected}
            metrics={dashboard.metrics}
            trend={dashboard.trend}
            priorities={dashboard.priorities}
            insights={dashboard.insights}
            properties={dashboard.properties}
            crmPipeline={dashboard.crmPipeline}
          />
        </div>
      </section>

      <nav className={styles.mobileDock} aria-label="Navegación móvil">
        <Link className={styles.active} href="/"><span>⌂</span><small>Inicio</small></Link>
        <Link href="/ventas"><span>◆</span><small>Propiedades</small></Link>
        <Link href="/vende"><span>＋</span><small>Captar</small></Link>
        <Link href="/seguimiento"><span>◎</span><small>CRM</small></Link>
        <Link href="/director"><span>✦</span><small>IA</small></Link>
      </nav>
    </main>
  );
}
