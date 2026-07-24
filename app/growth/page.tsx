import Link from "next/link";
import GrowthBacklog from "../components/GrowthBacklog";

export default function GrowthPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 34px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 850 }}>← Volver a Futura OS</Link>
        <span style={{ color: "#6b7280", fontSize: ".75rem" }}>Persistencia: Airtable · Análisis operativo sin tokens</span>
      </div>
      <GrowthBacklog />
    </main>
  );
}
