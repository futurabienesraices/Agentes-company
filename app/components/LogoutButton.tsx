"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Cerrar sesión activa"
      style={{
        background: "transparent",
        border: "1px solid rgba(229, 231, 235, 0.8)",
        borderRadius: "10px",
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#6b7280",
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {loading ? "Saliendo…" : "Salir ↵"}
    </button>
  );
}
