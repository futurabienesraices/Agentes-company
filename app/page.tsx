import Link from "next/link";
import { getDashboardData } from "../lib/dashboard";

const EMPTY_MESSAGE = "No hay elementos pendientes en este bloque.";
const agents = [
  { number: "00", href: "/contacto", name: "Captar cliente", detail: "Formulario público para registrar compradores, inquilinos y propietarios." },
  { number: "01", href: "/captador", name: "Agente Captador", detail: "Crear propiedades y corregir fichas incompletas." },
  { number: "02", href: "/comercial", name: "Agente Comercial", detail: "Priorizar coincidencias y activar oportunidades." },
  { number: "03", href: "/seguimiento", name: "Agente de Seguimiento", detail: "Resolver vencidos y programar el siguiente contacto." },
  { number: "04", href: "/publicaciones", name: "Agente de Publicaciones", detail: "Preparar y distribuir contenido inmobiliario." },
  { number: "05", href: "/visitas", name: "Agente de Visitas", detail: "Confirmar agenda y registrar resultados." },
  { number: "06", href: "/ofertas", name: "Agente de Ofertas", detail: "Controlar negociaciones y próximos pasos." },
  { number: "07", href: "/director", name: "Director IA", detail: "Coordinar prioridades entre todos los agentes." },
];

export default async function Home() {
  const dashboard = await getDashboardData();
  return (
    <main>
      <header className="topbar"><div><p className="eyebrow">FUTURA BIENES RAÍCES</p><h1>Centro de operaciones</h1><p className="lead">Un sistema de agentes especializados conectado directamente con Airtable.</p><div className="heroActions"><Link className="primaryButton" href="/contacto">Captar un cliente</Link><small>Comparte este formulario por WhatsApp, redes sociales o anuncios.</small></div></div><div className={`systemStatus ${dashboard.connected ? "online" : "offline"}`}><span className="dot" />{dashboard.connected ? "Airtable conectado" : "Airtable sin conexión"}</div></header>

      <section className="agentLauncher" aria-label="Agentes operativos">{agents.map((agent) => <Link className={`agentLaunchCard ${agent.href === "/director" ? "directorCard" : ""} ${agent.href === "/contacto" ? "captureLaunchCard" : ""}`} href={agent.href} key={agent.href}><span>{agent.number}</span><div><strong>{agent.name}</strong><p>{agent.detail}</p></div><b>→</b></Link>)}</section>

      <section className="metrics" aria-label="Resumen operativo">{dashboard.metrics.map((metric) => <article className="metricCard" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</section>

      <section className="dashboardGrid"><article className="panel prioritiesPanel"><div className="panelHeader"><div><p className="eyebrow">ACCIÓN INMEDIATA</p><h2>Prioridades de hoy</h2></div><span className="counter">{dashboard.priorities.length}</span></div><div className="itemList">{dashboard.priorities.length ? dashboard.priorities.map((item) => <div className="actionItem" key={item.id}><span className={`signal ${item.tone}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className="emptyState">{EMPTY_MESSAGE}</p>}</div></article><article className="panel aiPanel"><div className="panelHeader"><div><p className="eyebrow">CENTRO IA</p><h2>Decisiones sugeridas</h2></div><span className="aiMark">IA</span></div><div className="insightList">{dashboard.insights.map((item) => <div className={`insight ${item.tone}`} key={item.id}><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div></article><article className="panel activityPanel"><div className="panelHeader"><div><p className="eyebrow">CRM EN MOVIMIENTO</p><h2>Actividad reciente</h2></div></div><div className="timeline">{dashboard.recent.length ? dashboard.recent.map((item) => <div className="timelineItem" key={item.id}><span className={`signal ${item.tone}`} /><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>) : <p className="emptyState">Todavía no hay actividad reciente.</p>}</div></article></section>
      <footer>Dashboard V3 · Sistema completo de agentes conectado a FBR_CRM_Master</footer>
    </main>
  );
}
