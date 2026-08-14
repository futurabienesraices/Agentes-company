import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";
import HomeCommandBar from "./components/HomeCommandBar";
import styles from "./home.module.css";

export default async function Home() {
  const dashboard = await getDashboardData();
  const metric = (label: string) => dashboard.metrics.find((item) => item.label === label);

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
          <header className={styles.header}>
            <span className={styles.eyebrow}>Futura IA activa</span>
            <h1>¿Qué necesitas hacer?</h1>
            <p>Pregunta, revisa o ejecuta desde un solo lugar.</p>
          </header>

          <div className={styles.command}>
            <HomeCommandBar context={{ metrics: dashboard.metrics, priorities: dashboard.priorities, insights: dashboard.insights }} />
          </div>

          <div className={styles.pills} aria-label="Accesos rápidos">
            <Link className={styles.pill} href="/control">▥ Gráficos</Link>
            <Link className={styles.pill} href="/director">✦ Agentes</Link>
            <Link className={styles.pill} href="/ventas">◆ Propiedades</Link>
            <Link className={styles.pill} href="/seguimiento">◎ CRM</Link>
            <Link className={styles.pill} href="/vende">＋ Captar</Link>
          </div>

          <section className={styles.accordions} aria-label="Información y herramientas">
            <details className={styles.accordion} open>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>▥</span>Resumen del negocio</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}>
                <div className={styles.grid4}>
                  {dashboard.metrics.slice(0, 4).map((item) => <div className={styles.card} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}
                </div>
                <div className={styles.links}><Link href="/control">Abrir análisis completo</Link><Link href="/growth">Ver Growth AI</Link></div>
              </div>
            </details>

            <details className={styles.accordion}>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>◆</span>Propiedades</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}>
                <div className={styles.grid4}>
                  <div className={styles.card}><span>Activas</span><strong>{metric("Propiedades activas")?.value ?? 0}</strong><small>{metric("Propiedades activas")?.detail ?? "Sin datos"}</small></div>
                  <div className={styles.card}><span>Coincidencias</span><strong>{metric("Coincidencias")?.value ?? 0}</strong><small>{metric("Coincidencias")?.detail ?? "Sin datos"}</small></div>
                </div>
                <div className={styles.links}><Link href="/ventas">Ver propiedades</Link><Link href="/vende">Captar propiedad</Link><Link href="/contenido">Crear contenido</Link></div>
              </div>
            </details>

            <details className={styles.accordion}>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>◎</span>CRM y usuarios</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}>
                <div className={styles.grid4}>
                  <div className={styles.card}><span>Leads nuevos</span><strong>{metric("Leads nuevos")?.value ?? 0}</strong><small>{metric("Leads nuevos")?.detail ?? "Sin datos"}</small></div>
                  <div className={styles.card}><span>Seguimientos</span><strong>{metric("Seguimientos")?.value ?? 0}</strong><small>{metric("Seguimientos")?.detail ?? "Sin datos"}</small></div>
                </div>
                <div className={styles.links}><Link href="/seguimiento">Abrir CRM</Link><Link href="/ventas">Equipo comercial</Link></div>
              </div>
            </details>

            <details className={styles.accordion}>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>✦</span>Agentes IA</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}><p className={styles.note}>Administra el Director IA, Growth AI y los agentes de ventas, investigación, contenido y seguimiento desde sus módulos.</p><div className={styles.links}><Link href="/director">Director IA</Link><Link href="/growth">Growth AI</Link><Link href="/ventas">Equipo de ventas</Link></div></div>
            </details>

            <details className={styles.accordion}>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>◉</span>Uso de IA y tokens</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}><p className={styles.note}>Gemini es el proveedor principal de Futura IA. El panel de consumo detallado se mostrará aquí cuando conectemos la telemetría de uso por proveedor; no se muestran cifras inventadas.</p><div className={styles.links}><Link href="/control">Centro de control</Link></div></div>
            </details>

            <details className={styles.accordion}>
              <summary><span className={styles.summaryLeft}><span className={styles.icon}>⚙</span>Sistema y configuración</span><span className={styles.chev}>⌄</span></summary>
              <div className={styles.panel}><p className={styles.note}>Estado de datos: {dashboard.connected ? "conectado" : "pendiente"}. Desde aquí centralizaremos integraciones, proveedores IA, automatizaciones y permisos.</p><div className={styles.links}><Link href="/control">Abrir centro de control</Link></div></div>
            </details>
          </section>
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
