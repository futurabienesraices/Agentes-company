import type { Metadata } from "next";
import Link from "next/link";
import GrowthBacklog from "../components/GrowthBacklog";

export const metadata: Metadata = { title: "Growth AI" };

export default function GrowthPage() {
  return (
    <main style={{ width: "100%", maxWidth: "none", minHeight: "100dvh", margin: 0, padding: 0, background: "#f5f7fb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px clamp(20px, 4vw, 34px)", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 850 }}>← Volver a Futura OS</Link>
        <span style={{ color: "#6b7280", fontSize: ".75rem" }}>Airtable · Priorización sin tokens</span>
      </div>
      <GrowthBacklog />
    </main>
  );
}
