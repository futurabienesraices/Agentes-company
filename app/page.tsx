import { getDashboardData } from "../lib/dashboard";

const EMPTY_MESSAGE = "No hay elementos pendientes en este bloque.";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">FUTURA BIENES RAÍCES</p>
          <h1>Centro de operaciones</h1>
          <p className="lead">Lo que necesita atención comercial hoy, conectado directamente con Airtable.</p>
        </div>
        <div className={`systemStatus ${dashboard.connected ? "online" : "offline"}`}>
          <span className="dot" />
          {dashboard.connected ? "Airtable conectado" : "Airtable sin conexión"}
        </div>
      </header>

      <section className="metrics" aria-label="Resumen operativo">
        {dashboard.metrics.map((metric) => (
          <article className="metricCard" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboardGrid">
        <article className="panel prioritiesPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">ACCIÓN INMEDIATA</p>
              <h2>Prioridades de hoy</h2>
            </div>
            <span className="counter">{dashboard.priorities.length}</span>
          </div>
          <div className="itemList">
            {dashboard.priorities.length ? dashboard.priorities.map((item) => (
              <div className="actionItem" key={item.id}>
                <span className={`signal ${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            )) : <p className="emptyState">{EMPTY_MESSAGE}</p>}
          </div>
        </article>

        <article className="panel aiPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">CENTRO IA</p>
              <h2>Decisiones sugeridas</h2>
            </div>
            <span className="aiMark">IA</span>
          </div>
          <div className="insightList">
            {dashboard.insights.map((item) => (
              <div className={`insight ${item.tone}`} key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel activityPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">CRM EN MOVIMIENTO</p>
              <h2>Actividad reciente</h2>
            </div>
          </div>
          <div className="timeline">
            {dashboard.recent.length ? dashboard.recent.map((item) => (
              <div className="timelineItem" key={item.id}>
                <span className={`signal ${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            )) : <p className="emptyState">Todavía no hay actividad reciente.</p>}
          </div>
        </article>
      </section>

      <footer>
        Dashboard V1 · Datos operativos de FBR_CRM_Master
      </footer>
    </main>
  );
}
