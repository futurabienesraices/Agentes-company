"use client";

import { useEffect, useState } from "react";

type ServiceCheck = {
  key: string;
  name: string;
  configured: boolean;
  required: boolean;
  description: string;
};

type StatusPayload = {
  healthPercentage: number;
  configuredCount: number;
  totalCount: number;
  services: ServiceCheck[];
};

export default function IntegrationHealthCenter() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/status");
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return <p style={{ color: "#64748b", padding: 20 }}>Analizando estado de integraciones del sistema…</p>;
  }

  if (!data) {
    return <p style={{ color: "#ef4444", padding: 20 }}>No se pudo consultar la salud de las integraciones.</p>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, display: "grid", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Diagnóstico de Conexiones & Servicios</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            Revisión en tiempo real de API Keys y configuraciones de entorno.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: data.healthPercentage >= 80 ? "#10b981" : data.healthPercentage >= 50 ? "#f59e0b" : "#ef4444" }}>
              {data.healthPercentage}%
            </span>
            <small style={{ display: "block", color: "#64748b", fontSize: "0.75rem" }}>
              {data.configuredCount} de {data.totalCount} configurados
            </small>
          </div>
          <button
            onClick={loadStatus}
            style={{ border: "1px solid #cbd5e1", background: "#f8fafc", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
          >
            🔄 Recomprobar
          </button>
        </div>
      </div>

      {/* Services List */}
      <div style={{ display: "grid", gap: 10 }}>
        {data.services.map((service) => (
          <div
            key={service.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid " + (service.configured ? "#e2e8f0" : "#fee2e2"),
              background: service.configured ? "#f8fafc" : "#fff5f5",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1e293b" }}>{service.name}</span>
                {service.required && (
                  <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: "0.65rem", padding: "2px 6px", borderRadius: 6, fontWeight: 800 }}>
                    REQUERIDO
                  </span>
                )}
              </div>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.78rem" }}>{service.description}</p>
              <code style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{service.key}</code>
            </div>

            <div>
              {service.configured ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ecfdf5", color: "#059669", padding: "6px 12px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 800 }}>
                  ✓ Conectado
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef2f2", color: "#dc2626", padding: "6px 12px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 800 }}>
                  ⚠ Pendiente en Vercel
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
