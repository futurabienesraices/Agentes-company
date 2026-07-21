import Link from "next/link";
import ContentFactory from "../components/ContentFactory";

export default function ContentPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <div style={{ padding: "18px 34px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 800 }}>← Volver a Futura OS</Link>
      </div>
      <ContentFactory />
    </main>
  );
}
