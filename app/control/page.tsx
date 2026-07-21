import Link from "next/link";
import { getDashboardData } from "../../lib/dashboard";

const modules = [
  { icon: "🧠", name: "Memoria", detail: "Contexto compartido entre clientes, conversaciones y agentes.", state: "Activa", tone: "good" },
  { icon: "👤", name: "Personas", detail: "Registro central de prospectos, clientes, propietarios y contactos.", state: "Activa", tone: "good" },
  { icon: "🏢", name: "Empresas", detail: "Organizaciones, proveedores y futuras unidades de negocio.", state: "Preparada", tone: "neutral" },
  { icon: "📋", name: "Tareas", detail: "Seguimientos, vencimientos y próximas acciones del sistema.", state: "Activa", tone: "good" },
  { icon: "💬", name: "Conversaciones", detail: "Canales y mensajes vinculados a cada persona.", state: "Parcial", tone: "warning" },
  { icon: "📄", name: "Documentos", detail: "Contratos, fichas, archivos y conocimiento operativo.", state: "Próxima", tone: "neutral" },
  { icon: "🔔", name: "Eventos", detail: "Actividad del sistema para automatizaciones y alertas.", state: "Preparada", tone: "neutral" },
  { icon: "🤖", name: "Agentes", detail: "Especialistas digitales coordinados por el Director IA.", state: "Activa", tone: "good" },
  { icon: "🔧", name: "Herramientas", detail: "Conectores que permiten consultar y ejecutar acciones.", state: "Activa", tone: "good" },
];

export default async function ControlPage() {
  const dashboard = await getDashboardData();
  const integrations = [
    { name: "Airtable", detail: "Base operativa y CRM", active: dashboard.connected },
    { name: "OpenAI", detail: "Inteligencia y generación", active: Boolean(process.env.OPENAI_API_KEY) },
    { name: "WhatsApp", detail: "Canal Twilio pausado para pruebas", active: Boolean(process.env.TWILIO_AUTH_TOKEN), paused: true },
    { name: "Correo", detail: "Pendiente de conectar", active: false },
    { name: "Calendario", detail: "Pendiente de conectar", active: false },
  ];

  return (
    <main className="kernelPage">
      <aside className="kernelSidebar">
        <div className="kernelBrand"><span>F</span><div><strong>Futura OS</strong><small>Kernel Alpha</small></div></div>
        <nav>
          <Link href="/">⌂ <span>Inicio</span></Link>
          <Link className="active" href="/control">◉ <span>Centro de control</span></Link>
          <Link href="/contacto">◎ <span>Personas</span></Link>
          <Link href="/seguimiento">✓ <span>Tareas</span></Link>
          <Link href="/director">✦ <span>Agentes</span></Link>
        </nav>
        <div className="kernelFoot"><span className={dashboard.connected ? "online" : "offline"} />{dashboard.connected ? "Núcleo conectado" : "Núcleo degradado"}</div>
      </aside>

      <section className="kernelWorkspace">
        <header className="kernelHero">
          <div><p>FUTURA OS · NÚCLEO DEL SISTEMA</p><h1>Centro de control</h1><span>Una vista única para comprobar qué capacidades existen, cuáles están conectadas y qué falta construir.</span></div>
          <div className={`kernelHealth ${dashboard.connected ? "healthy" : "degraded"}`}><b>{dashboard.connected ? "Operativo" : "Degradado"}</b><small>Estado general</small></div>
        </header>

        <section className="kernelStats">
          <article><span>Módulos</span><strong>{modules.length}</strong><small>capacidades del núcleo</small></article>
          <article><span>Agentes</span><strong>8</strong><small>especialistas definidos</small></article>
          <article><span>Integraciones</span><strong>{integrations.filter((item) => item.active).length}/{integrations.length}</strong><small>con credenciales detectadas</small></article>
          <article><span>Datos</span><strong>{dashboard.connected ? "Live" : "—"}</strong><small>Airtable como fuente actual</small></article>
        </section>

        <div className="kernelSectionTitle"><div><p>CAPACIDADES</p><h2>Kernel de Futura OS</h2></div><span>Arquitectura compartida</span></div>
        <section className="kernelModules">
          {modules.map((module) => <article key={module.name}><div className="moduleIcon">{module.icon}</div><div><div className="moduleTitle"><strong>{module.name}</strong><span className={module.tone}>{module.state}</span></div><p>{module.detail}</p></div></article>)}
        </section>

        <section className="kernelBottom">
          <article className="kernelPanel"><div className="panelTitle"><div><p>HERRAMIENTAS</p><h2>Integraciones</h2></div><span>{integrations.filter((item) => item.active).length} conectadas</span></div><div className="integrationList">{integrations.map((item) => <div key={item.name}><span className={item.active ? (item.paused ? "paused" : "connected") : "pending"} /><div><strong>{item.name}</strong><small>{item.detail}</small></div><b>{item.active ? (item.paused ? "Pausada" : "Conectada") : "Pendiente"}</b></div>)}</div></article>
          <article className="kernelPanel nextPanel"><p>PRÓXIMO BLOQUE</p><h2>Personas como entidad central</h2><span>El siguiente cambio será separar la lógica de personas del agente inmobiliario para que CRM, Servicios Futura y futuras aplicaciones usen el mismo registro.</span><Link href="/contacto">Abrir personas →</Link></article>
        </section>
      </section>

      <style>{`
        body:has(.kernelPage){margin:0;background:#eef1f6;color:#152033}.kernelPage{width:100%;max-width:none;margin:0;padding:0;display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100dvh}.kernelSidebar{position:sticky;top:0;height:100dvh;background:#0f1726;color:white;padding:28px 20px;display:flex;flex-direction:column}.kernelBrand{display:flex;gap:12px;align-items:center;padding:0 8px 30px}.kernelBrand>span{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(145deg,#8b5cf6,#4f46e5);font-weight:800}.kernelBrand strong,.kernelBrand small{display:block}.kernelBrand small{color:#8390a7;font-size:.7rem;margin-top:3px}.kernelSidebar nav{display:grid;gap:7px}.kernelSidebar nav a{display:flex;gap:12px;align-items:center;padding:13px 14px;border-radius:13px;color:#9ca9bd;text-decoration:none;font-size:.88rem;font-weight:650}.kernelSidebar nav a:hover,.kernelSidebar nav a.active{background:#1c2738;color:white}.kernelSidebar nav a.active{box-shadow:inset 3px 0 #8b5cf6}.kernelFoot{margin-top:auto;display:flex;gap:9px;align-items:center;color:#8290a7;font-size:.76rem;padding:10px}.kernelFoot span{width:8px;height:8px;border-radius:50%}.kernelFoot .online{background:#34d399}.kernelFoot .offline{background:#fb7185}.kernelWorkspace{padding:42px clamp(24px,4vw,64px) 80px;overflow:hidden}.kernelHero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:28px}.kernelHero p,.kernelSectionTitle p,.panelTitle p,.nextPanel>p{margin:0 0 9px;color:#7a8494;letter-spacing:.12em;font-size:.67rem;font-weight:800}.kernelHero h1{font-size:clamp(2.6rem,5vw,4.8rem);margin:0;letter-spacing:-.06em}.kernelHero>div>span{display:block;max-width:720px;margin-top:14px;color:#667085;line-height:1.55}.kernelHealth{min-width:150px;padding:18px;border-radius:20px;background:white;border:1px solid #e3e7ee}.kernelHealth b,.kernelHealth small{display:block}.kernelHealth b{font-size:1.15rem}.kernelHealth small{margin-top:5px;color:#7b8493}.kernelHealth.healthy{box-shadow:inset 4px 0 #34d399}.kernelHealth.degraded{box-shadow:inset 4px 0 #fb7185}.kernelStats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.kernelStats article,.kernelModules article,.kernelPanel{background:white;border:1px solid #e2e7ee;border-radius:22px;box-shadow:0 12px 30px rgba(20,32,51,.04)}.kernelStats article{padding:20px}.kernelStats span,.kernelStats small{display:block;color:#788294}.kernelStats span{font-size:.78rem;font-weight:700}.kernelStats strong{display:block;font-size:2.25rem;margin:12px 0 6px;letter-spacing:-.06em}.kernelStats small{font-size:.72rem}.kernelSectionTitle{display:flex;justify-content:space-between;align-items:end;margin:38px 0 16px}.kernelSectionTitle h2,.panelTitle h2,.nextPanel h2{margin:0;font-size:1.75rem;letter-spacing:-.04em}.kernelSectionTitle>span{color:#7c8595;font-size:.8rem}.kernelModules{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.kernelModules article{padding:20px;display:grid;grid-template-columns:42px 1fr;gap:14px}.moduleIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#f0edff;font-size:1.15rem}.moduleTitle{display:flex;justify-content:space-between;gap:10px;align-items:center}.moduleTitle span{padding:5px 8px;border-radius:999px;font-size:.65rem;font-weight:800}.moduleTitle .good{background:#e9f9f0;color:#16844c}.moduleTitle .warning{background:#fff4df;color:#a36300}.moduleTitle .neutral{background:#eef1f5;color:#697386}.kernelModules p{margin:7px 0 0;color:#70798a;font-size:.8rem;line-height:1.45}.kernelBottom{display:grid;grid-template-columns:1.4fr .6fr;gap:14px;margin-top:14px}.kernelPanel{padding:24px}.panelTitle{display:flex;justify-content:space-between;align-items:start;margin-bottom:18px}.panelTitle>span{font-size:.72rem;color:#7b8493}.integrationList{display:grid;gap:8px}.integrationList>div{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:14px;background:#f7f8fa}.integrationList>div>span{width:8px;height:8px;border-radius:50%}.connected{background:#34d399}.paused{background:#f59e0b}.pending{background:#a5adba}.integrationList strong,.integrationList small{display:block}.integrationList small{color:#7b8493;margin-top:3px}.integrationList b{font-size:.7rem;color:#697386}.nextPanel{background:linear-gradient(145deg,#171e2d,#26324a);color:white}.nextPanel>p{color:#9aa6bc}.nextPanel>span{display:block;color:#bac3d2;line-height:1.55;margin:15px 0 24px}.nextPanel a{display:inline-flex;padding:11px 14px;border-radius:11px;background:white;color:#152033;text-decoration:none;font-weight:750;font-size:.78rem}@media(max-width:1100px){.kernelModules{grid-template-columns:repeat(2,1fr)}.kernelStats{grid-template-columns:repeat(2,1fr)}.kernelBottom{grid-template-columns:1fr}}@media(max-width:760px){.kernelPage{display:block}.kernelSidebar{position:fixed;z-index:50;left:10px;right:10px;bottom:10px;top:auto;height:auto;border-radius:20px;padding:8px;background:rgba(15,23,38,.95)}.kernelBrand,.kernelFoot{display:none}.kernelSidebar nav{grid-template-columns:repeat(5,1fr)}.kernelSidebar nav a{display:grid;place-items:center;padding:9px 3px;gap:3px;font-size:.9rem}.kernelSidebar nav a span{font-size:.52rem;text-align:center}.kernelWorkspace{padding:24px 14px 110px}.kernelHero{display:block}.kernelHealth{margin-top:18px}.kernelModules{grid-template-columns:1fr}.kernelStats{gap:9px}.kernelStats article{padding:16px}.kernelStats strong{font-size:1.8rem}.kernelSectionTitle{align-items:start}.kernelSectionTitle>span{display:none}}
      `}</style>
    </main>
  );
}
