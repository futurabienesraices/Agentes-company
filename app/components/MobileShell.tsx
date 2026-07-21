"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function MobileShell() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(Boolean(standalone));
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <>
      {!installed && prompt ? <button className="installAppButton" type="button" onClick={install}>Instalar Futura CRM</button> : null}
      <nav className="mobileDock" aria-label="Navegación móvil">
        <Link href="/"><span>⌂</span><small>Inicio</small></Link>
        <Link href="/seguimiento"><span>✓</span><small>Seguimiento</small></Link>
        <Link href="/comercial"><span>↗</span><small>Comercial</small></Link>
        <Link href="/visitas"><span>◷</span><small>Visitas</small></Link>
        <Link href="/director"><span>IA</span><small>Director</small></Link>
      </nav>
    </>
  );
}
