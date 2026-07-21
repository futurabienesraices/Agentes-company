const agents = [
  { name: "Estratega", role: "Coordina prioridades, campañas y objetivos", status: "Activo" },
  { name: "Analista de Propiedades", role: "Valida fichas y detecta datos faltantes", status: "Activo" },
  { name: "Contenido", role: "Genera guiones, anuncios y publicaciones", status: "Preparado" },
  { name: "Analista", role: "Mide leads, visitas, cierres y rendimiento", status: "Preparado" }
];

const workflow = [
  "Ingresar o sincronizar una propiedad",
  "Validar precio, ubicación, estado y material visual",
  "Definir audiencia y ángulo comercial",
  "Crear contenido y CTA de WhatsApp",
  "Registrar resultados y mejorar la siguiente campaña"
];

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">FUTURA BIENES RAÍCES</p>
          <h1>Centro de agentes inmobiliarios</h1>
          <p className="subtitle">
            Una base operativa para coordinar análisis, contenido, seguimiento y automatizaciones sin modificar AgenteSB.
          </p>
        </div>
        <div className="badge">Versión inicial</div>
      </header>

      <section className="metrics">
        <article><strong>4</strong><span>agentes configurados</span></article>
        <article><strong>1</strong><span>flujo inmobiliario</span></article>
        <article><strong>0</strong><span>integraciones activas</span></article>
      </section>

      <section>
        <div className="sectionHeading">
          <div><p className="eyebrow">EQUIPO DIGITAL</p><h2>Agentes disponibles</h2></div>
        </div>
        <div className="grid">
          {agents.map((agent) => (
            <article className="card" key={agent.name}>
              <div className="cardTop"><h3>{agent.name}</h3><span>{agent.status}</span></div>
              <p>{agent.role}</p>
              <button type="button" disabled>Abrir agente</button>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow">
        <div>
          <p className="eyebrow">FLUJO RECOMENDADO</p>
          <h2>De propiedad a campaña</h2>
          <p>Esta primera versión muestra la estructura. El siguiente paso es activar datos, memoria y ejecución real.</p>
        </div>
        <ol>
          {workflow.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
        </ol>
      </section>

      <footer>
        AgenteSB se mantiene como aplicación independiente y solo se usará como referencia funcional.
      </footer>
    </main>
  );
}
