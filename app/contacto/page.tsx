import Link from "next/link";
import LeadCaptureForm from "../components/LeadCaptureForm";

export const metadata = {
  title: "Encuentra tu propiedad | Futura Bienes Raíces",
  description: "Cuéntanos qué propiedad buscas y un asesor de Futura Bienes Raíces te contactará.",
};

export default function ContactoPage() {
  return (
    <main className="capturePage">
      <nav className="agentNav"><Link href="/">← Futura Bienes Raíces</Link></nav>
      <section className="captureHero">
        <div className="capturePitch">
          <p className="eyebrow">FUTURA BIENES RAÍCES</p>
          <h1>Encuentra la propiedad que realmente necesitas</h1>
          <p className="lead">Dinos qué buscas, dónde y cuál es tu presupuesto. Registraremos tu solicitud en nuestro sistema y un asesor continuará el proceso contigo.</p>
          <div className="captureBenefits">
            <div><strong>1</strong><span>Recibimos tu solicitud</span></div>
            <div><strong>2</strong><span>Buscamos coincidencias</span></div>
            <div><strong>3</strong><span>Un asesor te contacta</span></div>
          </div>
        </div>
        <article className="panel capturePanel">
          <div className="panelHeader"><div><p className="eyebrow">SOLICITUD INMOBILIARIA</p><h2>Cuéntanos qué buscas</h2></div></div>
          <LeadCaptureForm />
        </article>
      </section>
    </main>
  );
}
