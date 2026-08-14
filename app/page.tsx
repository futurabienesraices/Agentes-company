import HomeCommandBar from "./components/HomeCommandBar";
import HomeModules from "./components/HomeModules";
import { getDashboardData } from "../lib/dashboard";
import styles from "./home.module.css";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <main className={styles.shell}>
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

    </main>
  );
}
