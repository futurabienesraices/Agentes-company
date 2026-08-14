"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../home.module.css";

type Metric = { label: string; value: number; detail: string };
type Item = { id: string; title: string; detail: string; tone: "urgent" | "warning" | "good" | "neutral" };
type Trend = { label: string; value: number; detail: string };
type Tab = "resumen" | "propiedades" | "crm" | "analisis" | "captar";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "propiedades", label: "Propiedades" },
  { id: "crm", label: "CRM" },
  { id: "analisis", label: "Gráficos" },
  { id: "captar", label: "Captar" },
];

export default function HomeModules({ connected, metrics, trend, priorities, insights }: {
  connected: boolean;
  metrics: Metric[];
  trend: Trend[];
  priorities: Item[];
  insights: Item[];
}) {
  const [active, setActive] = useState<Tab>("resumen");
  const metric = (label: string) => metrics.find((item) => item.label === label);
  const maxTrend = Math.max(1, ...trend.map((item) => item.value));

  return (
    <section className={styles.modules} aria-label="Áreas de trabajo">
      <div className={styles.pills} role="tablist" aria-label="Funciones de Futura OS">
        {tabs.map((tab) => (
          <button
            aria-controls={`panel-${tab.id}`}
            aria-selected={active === tab.id}
            className={`${styles.pill} ${active === tab.id ? styles.pillActive : ""}`}
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActive(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div aria-labelledby={`tab-${active}`} className={styles.modulePanel} id={`panel-${active}`} role="tabpanel">
        {active === "resumen" ? (
          <>
            <header className={styles.panelHeading}><span>Hoy</span><h1>Lo importante, sin ruido.</h1></header>
            <div className={styles.metricGrid}>
              {metrics.slice(0, 4).map((item) => <div className={styles.metric} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}
            </div>
            <div className={styles.directList}>
              {insights.map((item) => <article key={item.id}><i data-tone={item.tone} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}
            </div>
          </>
        ) : null}

        {active === "propiedades" ? (
          <>
            <header className={styles.panelHeading}><span>Operación</span><h1>Propiedades que requieren movimiento.</h1></header>
            <div className={styles.metricGrid}>
              <div className={styles.metric}><span>Activas</span><strong>{metric("Propiedades activas")?.value ?? 0}</strong><small>{metric("Propiedades activas")?.detail ?? "Sin datos"}</small></div>
              <div className={styles.metric}><span>Coincidencias</span><strong>{metric("Coincidencias")?.value ?? 0}</strong><small>{metric("Coincidencias")?.detail ?? "Sin datos"}</small></div>
            </div>
            <Link className={styles.textAction} href="/ventas">Abrir propiedades y jornada comercial →</Link>
          </>
        ) : null}

        {active === "crm" ? (
          <>
            <header className={styles.panelHeading}><span>Prioridad</span><h1>Contactos y datos que no deben esperar.</h1></header>
            {priorities.length ? <div className={styles.directList}>{priorities.map((item) => <article key={item.id}><i data-tone={item.tone} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}</div> : <p className={styles.emptyState}>{connected ? "No hay pendientes priorizados." : "Conecta Airtable para ver prioridades reales."}</p>}
            <Link className={styles.textAction} href="/seguimiento">Abrir CRM y seguimiento →</Link>
          </>
        ) : null}

        {active === "analisis" ? (
          <>
            <header className={styles.panelHeading}><span>Evolución</span><h1>Leads y coincidencias de los últimos 7 días.</h1></header>
            <div className={styles.lineChart} aria-label="Gráfico de actividad de los últimos siete días">
              {trend.map((item) => <div className={styles.chartPoint} key={item.label}><div className={styles.chartColumn}><i style={{ height: `${Math.max(6, (item.value / maxTrend) * 100)}%` }} title={item.detail} /></div><strong>{item.value}</strong><span>{item.label}</span></div>)}
            </div>
            <Link className={styles.textAction} href="/control">Abrir análisis completo →</Link>
          </>
        ) : null}

        {active === "captar" ? (
          <>
            <header className={styles.panelHeading}><span>Nueva oportunidad</span><h1>Registra una propiedad y deja listo el siguiente paso.</h1></header>
            <p className={styles.captureCopy}>El flujo actual registra propietario, propiedad, lead y seguimiento. La captura móvil con fotos, video, voz y documentos sigue pendiente de construir.</p>
            <Link className={styles.primaryAction} href="/vende">Captar propiedad →</Link>
          </>
        ) : null}
      </div>
    </section>
  );
}
