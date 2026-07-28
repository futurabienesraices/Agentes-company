import Link from "next/link";
import OwnerCaptureForm from "../components/OwnerCaptureForm";
import styles from "./vende.module.css";

export const metadata = {
  title: "Vende o alquila tu propiedad | Futura Bienes Raíces",
  description: "Registra tu propiedad y solicita una evaluación comercial gratuita con Futura Bienes Raíces.",
};

export default function OwnerCapturePage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/vende"><i>F</i> Futura Bienes Raíces</Link>
        <span>Evaluación inicial gratuita · Sin publicación automática</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>CAPTACIÓN DE PROPIEDADES</p>
          <h1>Convierte tu propiedad en una oportunidad real.</h1>
          <p className={styles.lead}>Cuéntanos qué deseas vender o alquilar. Organizaremos los datos, evaluaremos su preparación comercial y un asesor continuará contigo.</p>
          <div className={styles.steps}>
            <div className={styles.step}><strong>1</strong><span>Registramos la propiedad y tus objetivos.</span></div>
            <div className={styles.step}><strong>2</strong><span>Revisamos precio, documentación y presentación.</span></div>
            <div className={styles.step}><strong>3</strong><span>Diseñamos el plan de publicación y búsqueda de clientes.</span></div>
          </div>
          <div className={styles.trust}><span>✓ Tus datos no se venden</span><span>✓ Aprobación antes de publicar</span><span>✓ Seguimiento en el CRM</span></div>
        </div>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p>SOLICITUD DE EVALUACIÓN</p>
            <h2>Registra tu propiedad</h2>
            <span>Completa lo que conozcas. El equipo validará lo demás contigo.</span>
          </div>
          <OwnerCaptureForm />
        </article>
      </section>

      <footer className={styles.footer}>Futura Bienes Raíces · Atención comercial con revisión humana</footer>
    </main>
  );
}
