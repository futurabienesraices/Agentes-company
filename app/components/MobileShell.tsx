"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function MobileShell() {
  const pathname = usePathname();
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

  if (pathname === "/login") return null;
  const canInstall = !installed && Boolean(prompt);
  const links = [
    { href: "/", icon: "⌂", label: "Inicio" },
    { href: "/seguimiento", icon: "✓", label: "CRM" },
    { href: "/growth", icon: "↗", label: "Growth" },
    { href: "/contenido", icon: "◫", label: "Contenido" },
    { href: "/director", icon: "IA", label: "Director" },
  ];

  return (
    <>
      <nav className={`mobileDock ${canInstall ? "withInstall" : ""}`} aria-label="Navegación móvil">
        {links.map((item) => <Link className={pathname === item.href ? "active" : ""} href={item.href} key={item.href}><span>{item.icon}</span><small>{item.label}</small></Link>)}
        {canInstall ? <button className="mobileInstallAction" type="button" onClick={install}><span>↓</span><small>Instalar</small></button> : null}
      </nav>
      <style jsx>{`
        .mobileInstallAction{display:grid;place-items:center;gap:3px;min-height:50px;border:0;border-radius:15px;background:#111827;color:#fff;cursor:pointer}
        .mobileInstallAction span{font-size:1rem;font-weight:800;line-height:1}
        .mobileInstallAction small{font-size:.61rem;color:#d7dce5}
        :global(.mobileDock a.active){background:#eef6ff;color:#0071e3}
        :global(.mobileDock a.active small){color:#0071e3}
        @media(max-width:620px){.mobileDock.withInstall{grid-template-columns:repeat(6,1fr)}}
      `}</style>
    </>
  );
}
