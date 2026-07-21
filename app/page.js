const agents = [
  { name: 'Agente de Captación', role: 'Detecta propietarios y oportunidades', status: 'Preparado' },
  { name: 'Agente de Propiedades', role: 'Analiza inmuebles, precios y documentación', status: 'Preparado' },
  { name: 'Agente de Clientes', role: 'Califica compradores y arrendatarios', status: 'Preparado' },
  { name: 'Agente de Contenido', role: 'Genera publicaciones y campañas', status: 'Preparado' },
  { name: 'Agente Coordinador', role: 'Asigna tareas y consolida resultados', status: 'Preparado' },
  { name: 'Agente Analista', role: 'Crea reportes y recomendaciones', status: 'Preparado' },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Futura Bienes Raíces</p>
          <h1>Centro de operaciones de agentes</h1>
          <p className="lead">
            Una base independiente para coordinar agentes de inteligencia artificial sin modificar Agentes SV.
          </p>
        </div>
        <div className="systemStatus">
          <span className="dot" /> Sistema inicial activo
        </div>
      </section>

      <section className="stats">
        <article><strong>6</strong><span>Agentes definidos</span></article>
        <article><strong>0</strong><span>Tareas en ejecución</span></article>
        <article><strong>1</strong><span>Entorno conectado</span></article>
      </section>

      <section>
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Equipo digital</p>
            <h2>Agentes inmobiliarios</h2>
          </div>
          <button type="button" disabled>Crear tarea — próximamente</button>
        </div>

        <div className="grid">
          {agents.map((agent) => (
            <article className="card" key={agent.name}>
              <div className="cardTop">
                <span className="avatar">AI</span>
                <span className="badge">{agent.status}</span>
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <div className="cardFooter">Sin tareas pendientes</div>
            </article>
          ))}
        </div>
      </section>

      <section className="roadmap">
        <p className="eyebrow">Próximos módulos</p>
        <h2>De panel informativo a sistema operativo</h2>
        <div className="steps">
          <span>01 · Memoria y base de datos</span>
          <span>02 · Bandeja de tareas</span>
          <span>03 · WhatsApp y formularios</span>
          <span>04 · Automatizaciones y reportes</span>
        </div>
      </section>
    </main>
  );
}
