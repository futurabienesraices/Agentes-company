import Link from "next/link";
import SalesDayButton from "../components/SalesDayButton";
import { getSalesCockpit } from "../../lib/sales";
import styles from "./ventas.module.css";

export const metadata = {
  title: "Equipo de Ventas · Futura OS",
  description: "Jornada diaria de captación, publicación, prospección y seguimiento comercial.",
};

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const cockpit = await getSalesCockpit();

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/">← Volver a Futura OS</Link>
        <span>Venta supervisada · Sin spam · Priorización sin tokens</span>
      </header>

      <section className={styles.workspace}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>EQUIPO DE VENTAS DIGITAL</p>
            <h1>Buscar, publicar, contactar y vender.</h1>
            <p className={styles.lead}>Un equipo coordinado prepara la jornada comercial diaria usando propiedades, leads y resultados reales. Las publicaciones externas y mensajes sensibles permanecen bajo aprobación humana.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.linkButton} href="/vende">Captar propietario</Link>
            <Link className={styles.linkButton} href="/contenido">Crear campaña</Link>
            <SalesDayButton />
          </div>
        </header>

        <section className={styles.stats} aria-label="Indicadores comerciales">
          {cockpit.stats.map((stat) => <article className={styles.stat} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}
        </section>

        {!cockpit.connected ? <div className={styles.notice}>{cockpit.message || "No se pudo conectar con Airtable."}</div> : null}

        <section className={styles.grid}>
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHeader}><div><p>JORNADA RECOMENDADA</p><h2>Acciones que producen conversaciones</h2></div><span>{cockpit.actions.length} acciones priorizadas</span></div>
            <div className={styles.actions}>
              {cockpit.actions.length ? cockpit.actions.map((action, index) => (
                <div className={styles.action} key={action.id}>
                  <span className={styles.actionIndex}>{index + 1}</span>
                  <div><strong>{action.title}</strong><p><b>{action.agent}</b> · {action.detail}</p></div>
                  <div className={styles.actionMeta}><span className={styles.pill}>{action.channel}</span><span className={styles.priority}>{action.priority}</span></div>
                </div>
              )) : <p className={styles.empty}>No hay acciones disponibles todavía.</p>}
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}><div><p>AGENTES DIGITALES</p><h2>Equipo coordinado</h2></div><span>{cockpit.agents.length} agentes</span></div>
            <div className={styles.agents}>
              {cockpit.agents.map((agent) => (
                <div className={styles.agent} key={agent.id}>
                  <i />
                  <div><strong>{agent.name}</strong><small>{agent.mission}</small><div className={styles.channels}>{agent.channels.map((channel) => <span key={channel}>{channel}</span>)}</div></div>
                  <em>{agent.status} · {agent.workload}</em>
                  <div className={styles.boundary}>{agent.boundary}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}><div><p>REGLAS COMERCIALES</p><h2>Vender sin arriesgar cuentas</h2></div></div>
            <div className={styles.notice}>Futura puede preparar textos, seleccionar propiedades, organizar listas y crear tareas. Marketplace, grupos y plataformas sin una API autorizada se publican manualmente. El correo y WhatsApp se usan con consentimiento, relación previa o una base legítima, evitando mensajes masivos no solicitados.</div>
            <p className={styles.footerNote}>Este enfoque protege las cuentas, la reputación y el presupuesto mientras medimos qué canales sí generan consultas, visitas y cierres.</p>
          </article>

          <article className={`${styles.card} ${styles.wide}`}>
            <div className={styles.cardHeader}><div><p>INVENTARIO Y DEMANDA</p><h2>Qué promover y a quién atender</h2></div><Link href="/seguimiento">Abrir CRM</Link></div>
            <div className={styles.twoColumns}>
              <div className={styles.records}>
                <strong>Propiedades para promoción</strong>
                {cockpit.properties.length ? cockpit.properties.map((property) => <div className={styles.record} key={property.id}><div className={styles.recordTop}><strong>{property.title}</strong><span>{property.code || "Sin código"}</span></div><p>{property.detail} · {property.readiness}</p></div>) : <p className={styles.empty}>No hay propiedades listas para promoción.</p>}
              </div>
              <div className={styles.records}>
                <strong>Leads que requieren contacto</strong>
                {cockpit.pendingLeads.length ? cockpit.pendingLeads.map((lead) => <div className={styles.record} key={lead.id}><div className={styles.recordTop}><strong>{lead.name}</strong><span>{lead.priority}</span></div><p>{lead.detail}</p></div>) : <p className={styles.empty}>No hay leads pendientes.</p>}
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
