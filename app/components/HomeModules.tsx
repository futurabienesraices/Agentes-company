"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import styles from "../home.module.css";
import PropertyCatalog from "./PropertyCatalog";
import CrmPipeline from "./CrmPipeline";
import type { CatalogProperty, CrmStage } from "../../lib/dashboard";
const GrowthBacklog = dynamic(() => import("./GrowthBacklog"));
const ContentFactory = dynamic(() => import("./ContentFactory"));
const OwnerCaptureForm = dynamic(() => import("./OwnerCaptureForm"));
const SalesDayButton = dynamic(() => import("./SalesDayButton"));

type Metric = { label: string; value: number; detail: string };
type Item = { id: string; title: string; detail: string; tone: "urgent" | "warning" | "good" | "neutral" };
type Trend = { label: string; value: number; detail: string };
type Tab = "resumen" | "ventas" | "propiedades" | "crm" | "analisis" | "agentes" | "growth" | "contenido" | "captar";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "ventas", label: "Ventas" },
  { id: "propiedades", label: "Propiedades" },
  { id: "crm", label: "CRM" },
  { id: "analisis", label: "Gráficos" },
  { id: "agentes", label: "Agentes" },
  { id: "growth", label: "Growth" },
  { id: "contenido", label: "Contenido" },
  { id: "captar", label: "Captar" },
];

export default function HomeModules({ connected, metrics, trend, priorities, insights, properties, crmPipeline }: {
  connected: boolean;
  metrics: Metric[];
  trend: Trend[];
  priorities: Item[];
  insights: Item[];
  properties: CatalogProperty[];
  crmPipeline: CrmStage[];
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
            <header className={styles.panelHeading}><span>Inventario</span><h1>Catálogo de propiedades.</h1></header>
            <PropertyCatalog properties={properties} />
          </>
        ) : null}

        {active === "ventas" ? (
          <>
            <header className={styles.panelHeading}><span>Jornada comercial</span><h1>Qué mover y qué contacto atender hoy.</h1></header>
            <div className={styles.directList}>
              {priorities.length ? priorities.map((item) => <article key={item.id}><i data-tone={item.tone} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>) : <p className={styles.emptyState}>Aún no hay acciones priorizadas.</p>}
            </div>
            <div className={styles.salesAction}><SalesDayButton /></div>
          </>
        ) : null}

        {active === "crm" ? (
          <>
            <header className={styles.panelHeading}><span>CRM</span><h1>Pipeline comercial, de izquierda a derecha.</h1></header>
            {connected ? <CrmPipeline stages={crmPipeline} /> : <p className={styles.emptyState}>Conecta Airtable para ver el pipeline real.</p>}
            <p className={styles.captureCopy}>Selecciona un lead para revisar su etapa y registra el siguiente contacto desde la misma operación.</p>
          </>
        ) : null}

        {active === "analisis" ? (
          <>
            <header className={styles.panelHeading}><span>Evolución</span><h1>Leads y coincidencias de los últimos 7 días.</h1></header>
            <div className={styles.lineChart} aria-label="Gráfico de actividad de los últimos siete días">
              {trend.map((item) => <div className={styles.chartPoint} key={item.label}><div className={styles.chartColumn}><i style={{ height: `${Math.max(6, (item.value / maxTrend) * 100)}%` }} title={item.detail} /></div><strong>{item.value}</strong><span>{item.label}</span></div>)}
            </div>
            <p className={styles.captureCopy}>Los datos se mantienen aquí para evitar saltos entre pantallas.</p>
          </>
        ) : null}

        {active === "agentes" ? (
          <>
            <header className={styles.panelHeading}><span>Coordinación</span><h1>Agentes disponibles desde una sola vista.</h1></header>
            <div className={styles.directList}>
              <article><i data-tone="good" /><div><strong>Director IA</strong><p>Responde desde la barra principal, prioriza datos internos y señala lo que falta antes de ejecutar.</p></div></article>
              <article><i data-tone="good" /><div><strong>Growth AI</strong><p>Opera el backlog vivo de oportunidades dentro de esta misma pantalla.</p></div></article>
              <article><i data-tone="neutral" /><div><strong>Ventas, CRM y Contenido</strong><p>Se activan con los módulos directos de Propiedades, CRM y Contenido; no abren una aplicación aparte.</p></div></article>
            </div>
          </>
        ) : null}

        {active === "growth" ? <GrowthBacklog /> : null}

        {active === "contenido" ? <ContentFactory /> : null}

        {active === "captar" ? (
          <>
            <header className={styles.panelHeading}><span>Nueva oportunidad</span><h1>Registra una propiedad y deja listo el siguiente paso.</h1></header>
            <p className={styles.captureCopy}>La captación se realiza aquí mismo. Fotos, video, dictado y documentos siguen como la siguiente mejora del flujo móvil.</p>
            <OwnerCaptureForm />
          </>
        ) : null}
      </div>
    </section>
  );
}
