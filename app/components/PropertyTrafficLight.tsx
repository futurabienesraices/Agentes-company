"use client";

import type { TrafficLightSummary, TrafficColor, TrafficLightResult } from "../../lib/property-traffic-light";

const COLOR_CONFIG: Record<TrafficColor, { bg: string; border: string; badge: string; text: string }> = {
  nueva:     { bg: "#eff6ff", border: "#bfdbfe", badge: "#1d4ed8", text: "#1e3a8a" },
  mejorar:   { bg: "#fffbeb", border: "#fde68a", badge: "#b45309", text: "#78350f" },
  atencion:  { bg: "#fef2f2", border: "#fecaca", badge: "#dc2626", text: "#7f1d1d" },
  bien:      { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", text: "#14532d" },
  archivada: { bg: "#f9fafb", border: "#e5e7eb", badge: "#6b7280", text: "#374151" },
};

const FILTER_LABELS: Array<{ key: TrafficColor | "all"; label: string }> = [
  { key: "all",      label: "Todas" },
  { key: "atencion", label: "🔴 Atención" },
  { key: "nueva",    label: "🔵 Nuevas" },
  { key: "mejorar",  label: "🟡 Mejorar" },
  { key: "bien",     label: "🟢 Van bien" },
  { key: "archivada",label: "⚫ Archivadas" },
];

import { useState } from "react";

export default function PropertyTrafficLight({ data }: { data: TrafficLightSummary }) {
  const [filter, setFilter] = useState<TrafficColor | "all">("all");
  const visible = filter === "all" ? data.items : data.items.filter((item) => item.color === filter);
  const total = data.items.length;

  return (
    <div style={{ marginTop: 8 }}>

      {/* Summary bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {(["atencion", "nueva", "mejorar", "bien"] as TrafficColor[]).map((color) => {
          const c = COLOR_CONFIG[color];
          const count = data.counts[color];
          if (!count) return null;
          const labels: Record<TrafficColor, string> = { atencion: "🔴 Atención", nueva: "🔵 Nuevas", mejorar: "🟡 Mejorar", bien: "🟢 Van bien", archivada: "⚫" };
          return (
            <button
              key={color}
              onClick={() => setFilter(filter === color ? "all" : color)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 999,
                border: `1.5px solid ${filter === color ? c.badge : c.border}`,
                background: c.bg, color: c.badge,
                cursor: "pointer", font: "inherit", fontSize: ".76rem", fontWeight: 800,
                transition: "transform .14s",
              }}
            >
              {labels[color]} <span style={{ background: c.badge, color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: ".68rem" }}>{count}</span>
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: ".72rem", alignSelf: "center" }}>
          {total} propiedad{total !== 1 ? "es" : ""} en total
        </span>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              appearance: "none", border: "1px solid", borderRadius: 999,
              padding: "5px 11px", cursor: "pointer", font: "inherit",
              fontSize: ".72rem", fontWeight: 700,
              borderColor: filter === key ? "#6366f1" : "#e3e7ee",
              background: filter === key ? "#eef3ff" : "#fff",
              color: filter === key ? "#4338ca" : "#64748b",
            }}
          >
            {label} {key !== "all" && data.counts[key as TrafficColor] > 0 ? `(${data.counts[key as TrafficColor]})` : ""}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visible.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: ".84rem", textAlign: "center", padding: "32px 0" }}>
          No hay propiedades en esta categoría.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {visible.map((item) => <TrafficCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function TrafficCard({ item }: { item: TrafficLightResult }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_CONFIG[item.color];

  return (
    <article
      style={{
        border: `1.5px solid ${c.border}`,
        borderRadius: 14,
        background: c.bg,
        overflow: "hidden",
        transition: "box-shadow .2s",
      }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "grid",
          gridTemplateColumns: "36px minmax(0,1fr) auto",
          gap: 10, alignItems: "center",
          padding: "14px 16px", cursor: "pointer",
          background: "transparent", border: "none", font: "inherit", textAlign: "left",
        }}
      >
        {/* Color dot */}
        <span style={{
          width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center",
          background: c.badge, color: "#fff", fontSize: "1.05rem", flexShrink: 0,
        }}>
          {item.emoji}
        </span>

        <div style={{ minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: ".85rem", color: c.text, letterSpacing: "-.01em" }}>
            {item.title}
          </strong>
          <span style={{ display: "block", fontSize: ".7rem", color: "#64748b", marginTop: 2 }}>
            {item.code && <>{item.code} · </>}
            <span style={{ color: c.badge, fontWeight: 700 }}>{item.label}</span>
            {item.reason ? <> · {item.reason}</> : null}
          </span>
        </div>

        {/* Completion badge */}
        <span style={{
          padding: "4px 10px", borderRadius: 999, fontSize: ".66rem", fontWeight: 800,
          background: item.completion >= 80 ? "#dcfce7" : item.completion >= 60 ? "#fef3c7" : "#fee2e2",
          color: item.completion >= 80 ? "#166534" : item.completion >= 60 ? "#92400e" : "#991b1b",
          whiteSpace: "nowrap",
        }}>
          {item.completion}%
        </span>
      </button>

      {/* Expanded action + missing */}
      {open && (
        <div style={{ padding: "0 16px 16px 16px", borderTop: `1px solid ${c.border}` }}>
          <p style={{ margin: "12px 0 8px", fontSize: ".82rem", color: c.text, fontWeight: 700 }}>
            👉 {item.action}
          </p>
          {item.missing.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {item.missing.map((field) => (
                <span key={field} style={{
                  padding: "3px 9px", borderRadius: 999, fontSize: ".67rem", fontWeight: 800,
                  background: "#fee2e2", color: "#991b1b",
                }}>
                  ✗ {field}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
