import type { Metadata } from "next";
import Link from "next/link";
import ContentFactory from "../components/ContentFactory";

export const metadata: Metadata = { title: "Fábrica editorial" };

export default function ContentPage() {
  return (
    <main style={{ width: "100%", maxWidth: "none", minHeight: "100dvh", margin: 0, padding: 0, background: "#f5f7fb" }}>
      <div style={{ padding: "18px clamp(20px, 4vw, 34px)", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 800 }}>← Volver a Futura OS</Link>
      </div>
      <ContentFactory />
    </main>
  );
}
