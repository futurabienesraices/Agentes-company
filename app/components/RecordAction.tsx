"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Entity = "followUp" | "visit" | "publication" | "offer";

type Props = {
  recordId: string;
  entity: Entity;
  label: string;
  fields: Record<string, string>;
  successMessage?: string;
  secondary?: boolean;
};

export default function RecordAction({
  recordId,
  entity,
  label,
  fields,
  successMessage = "Registro actualizado",
  secondary = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function updateRecord() {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, entity, fields }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible actualizar el registro.");
      setStatus(successMessage);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recordAction">
      <button
        type="button"
        className={secondary ? "secondaryAction" : ""}
        disabled={loading}
        onClick={updateRecord}
      >
        {loading ? "Actualizando…" : label}
      </button>
      {status ? <small>{status}</small> : null}
    </div>
  );
}
