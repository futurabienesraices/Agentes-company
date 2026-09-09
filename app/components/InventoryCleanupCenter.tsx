"use client";

import { useState, useEffect } from "react";

type InventoryItem = {
  id: string;
  code: string;
  title: string;
  commercialStatus: string;
  price?: number;
  location?: string;
  propertyType?: string;
  photosCount: number;
  completionScore: number;
  missingFields: string[];
  isReady: boolean;
  isStale: boolean;
  recommendation: "confirm_active" | "archive_sold" | "add_photos" | "fill_price";
};

type InventoryReport = {
  totalActive: number;
  readyCount: number;
  incompleteCount: number;
  staleCount: number;
  missingPhotosCount: number;
  items: InventoryItem[];
};

export default function InventoryCleanupCenter() {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tinder" | "media" | "list">("tinder");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Media attachment state
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [mediaUrlsInput, setMediaUrlsInput] = useState("");
  const [driveUrlInput, setDriveUrlInput] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [attachSuccess, setAttachSuccess] = useState(false);

  // Batch action selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "incomplete" | "no_photos" | "stale">("all");

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory-cleanup");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fallo al cargar inventario.");
      setReport(json.report);
      if (json.report?.items?.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(json.report.items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStatus = async (propertyId: string, newStatus: "Disponible" | "Vendida" | "Alquilada" | "Archivada") => {
    try {
      const res = await fetch("/api/inventory-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_status_update",
          propertyIds: [propertyId],
          newStatus,
        }),
      });
      if (res.ok) {
        // Actualizar reporte localmente
        setReport((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) => (i.id === propertyId ? { ...i, commercialStatus: newStatus } : i)),
          };
        });
      }
    } catch (err) {
      console.warn("Error al actualizar estado:", err);
    }
  };

  const handleAttachMedia = async () => {
    if (!selectedPropertyId) return;
    setAttaching(true);
    setAttachSuccess(false);

    const urls = mediaUrlsInput
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/inventory-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_media",
          propertyId: selectedPropertyId,
          mediaUrls: urls,
          driveUrl: driveUrlInput,
        }),
      });

      if (res.ok) {
        setAttachSuccess(true);
        setMediaUrlsInput("");
        setDriveUrlInput("");
        fetchInventory();
        setTimeout(() => setAttachSuccess(false), 3000);
      }
    } catch (err) {
      console.warn("Error al adjuntar fotos:", err);
    } finally {
      setAttaching(false);
    }
  };

  const handleBatchAction = async (newStatus: "Vendida" | "Archivada" | "Disponible") => {
    if (selectedIds.length === 0) return;
    try {
      await fetch("/api/inventory-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_status_update",
          propertyIds: selectedIds,
          newStatus,
        }),
      });
      setSelectedIds([]);
      fetchInventory();
    } catch (err) {
      console.warn("Error en acción por lotes:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
        <div className="animate-spin text-blue-600 text-3xl mx-auto">⚙️</div>
        <p className="text-sm font-semibold text-slate-700">Auditando inventario y escaneando catálogo...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex justify-between items-center">
        <span>⚠️ Error: {error || "No se pudo cargar el reporte del inventario."}</span>
        <button onClick={fetchInventory} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">
          Reintentar
        </button>
      </div>
    );
  }

  const activeItems = report.items.filter(
    (i) => !["Vendida", "Alquilada", "Archivada"].includes(i.commercialStatus)
  );

  const currentItem = activeItems[currentIndex] || activeItems[0];

  const filteredItems = report.items.filter((item) => {
    if (filter === "incomplete") return !item.isReady;
    if (filter === "no_photos") return item.photosCount === 0;
    if (filter === "stale") return item.isStale;
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-400/30">
            <span>🧹 Operación Orden</span>
            <span>•</span>
            <span>Centro de Depuración de Inventario</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Depuración y Centralización de Propiedades</h2>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl">
            Limpia registros obsoletos o vendidos, completa datos faltantes y centraliza fotos y carpetas de Google Drive en Cloudinary y Airtable.
          </p>
        </div>
      </div>

      {/* Metrics Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center">
          <span className="text-xs text-slate-500 font-semibold block">Activas Totales</span>
          <span className="text-2xl font-bold text-slate-900">{report.totalActive}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
          <span className="text-xs text-emerald-700 font-semibold block">🟢 100% Listas</span>
          <span className="text-2xl font-bold text-emerald-900">{report.readyCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
          <span className="text-xs text-amber-700 font-semibold block">🟡 Incompletas</span>
          <span className="text-2xl font-bold text-amber-900">{report.incompleteCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
          <span className="text-xs text-rose-700 font-semibold block">📷 Sin Fotos</span>
          <span className="text-2xl font-bold text-rose-900">{report.missingPhotosCount}</span>
        </div>
        <div className="bg-slate-100 border border-slate-300 p-4 rounded-xl text-center col-span-2 md:col-span-1">
          <span className="text-xs text-slate-600 font-semibold block">⚠️ Sin Precio/Datos</span>
          <span className="text-2xl font-bold text-slate-800">{report.staleCount}</span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("tinder")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "tinder" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          ⚡ Modo Limpieza Guiada (1 por 1)
        </button>

        <button
          onClick={() => setActiveTab("media")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "media" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          📸 Centralizador Multimedia (Cloudinary/Drive)
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          📋 Lista General ({filteredItems.length})
        </button>
      </div>

      {/* TAB 1: TINDER QUICK REVIEW MODE */}
      {activeTab === "tinder" && currentItem && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Revisando {currentIndex + 1} de {activeItems.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={currentIndex >= activeItems.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(activeItems.length - 1, prev + 1))}
                className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold">{currentItem.code}</span>
                  <h3 className="text-xl font-bold text-slate-900">{currentItem.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    📍 {currentItem.location || "Ubicación sin registrar"} | 🏠 {currentItem.propertyType}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 block">
                    {currentItem.price ? `$${currentItem.price.toLocaleString()}` : "⚠️ Sin precio"}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      currentItem.isReady
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Salud: {currentItem.completionScore}%
                  </span>
                </div>
              </div>

              {currentItem.missingFields.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    ⚠️ Campos Faltantes:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentItem.missingFields.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-200/60 text-amber-900 text-xs font-semibold rounded-md">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Acción Rápida</span>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleUpdateStatus(currentItem.id, "Disponible");
                    if (currentIndex < activeItems.length - 1) setCurrentIndex((p) => p + 1);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
                >
                  ✓ Confirmar Disponible
                </button>

                <button
                  onClick={() => {
                    handleUpdateStatus(currentItem.id, "Vendida");
                    if (currentIndex < activeItems.length - 1) setCurrentIndex((p) => p + 1);
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
                >
                  🔴 Marcar como Vendida
                </button>

                <button
                  onClick={() => {
                    handleUpdateStatus(currentItem.id, "Archivada");
                    if (currentIndex < activeItems.length - 1) setCurrentIndex((p) => p + 1);
                  }}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
                >
                  📦 Archivar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDIA CENTRALIZER */}
      {activeTab === "media" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Centralizador Multimedia de Fotos y Videos</h3>
            <p className="text-xs text-slate-500">
              Sube enlaces de fotos, archivos o carpetas de Google Drive/WhatsApp. Las imágenes se subirán automáticamente a Cloudinary y se vincularán al registro de Airtable.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seleccionar Propiedad Objetivo
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900"
              >
                {report.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.code}] {i.title} ({i.photosCount} fotos actuales)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                URLs de Fotos (Una por línea)
              </label>
              <textarea
                rows={4}
                value={mediaUrlsInput}
                onChange={(e) => setMediaUrlsInput(e.target.value)}
                placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Enlace a Carpeta de Google Drive / Dropbox (Opcional)
              </label>
              <input
                type="text"
                value={driveUrlInput}
                onChange={(e) => setDriveUrlInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <button
              onClick={handleAttachMedia}
              disabled={attaching || !selectedPropertyId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {attaching ? "Subiendo a Cloudinary y Airtable..." : "🚀 Centralizar Multimedia en Cloudinary"}
            </button>

            {attachSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center">
                ✓ Fotos y enlace multimedia integrados con éxito en la ficha de la propiedad.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIST VIEW */}
      {activeTab === "list" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Todas ({report.items.length})
              </button>
              <button
                onClick={() => setFilter("incomplete")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${filter === "incomplete" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Incompletas ({report.incompleteCount})
              </button>
              <button
                onClick={() => setFilter("no_photos")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${filter === "no_photos" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                Sin Fotos ({report.missingPhotosCount})
              </button>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAction("Vendida")}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg"
                >
                  Marcar ({selectedIds.length}) Vendidas
                </button>
                <button
                  onClick={() => handleBatchAction("Archivada")}
                  className="px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg"
                >
                  Archivar ({selectedIds.length})
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-3">Sel.</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Título / Nombre</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Fotos</th>
                  <th className="p-3">Salud</th>
                  <th className="p-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, item.id]);
                            else setSelectedIds(selectedIds.filter((id) => id !== item.id));
                          }}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{item.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.title}</td>
                      <td className="p-3 font-semibold text-slate-600">{item.commercialStatus}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {item.price ? `$${item.price.toLocaleString()}` : <span className="text-amber-600">Sin precio</span>}
                      </td>
                      <td className="p-3 text-slate-700">📷 {item.photosCount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${item.isReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {item.completionScore}%
                        </span>
                      </td>
                      <td className="p-3 space-x-1">
                        <button
                          onClick={() => handleUpdateStatus(item.id, "Vendida")}
                          className="px-2 py-1 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded font-semibold"
                        >
                          Vendida
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "Archivada")}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold"
                        >
                          Archivar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
