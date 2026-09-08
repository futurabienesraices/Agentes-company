"use client";

import { useState, useCallback, useRef } from "react";

type Asset = {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  folder: string;
  created_at: string;
};

const FOLDERS = [
  { id: "futura/bienes-raices", label: "🏠 Bienes Raíces", color: "#6366f1" },
  { id: "futura/limpieza", label: "🧹 Limpieza de Muebles", color: "#10b981" },
  { id: "futura/apps", label: "💻 Apps & Productos Digitales", color: "#f59e0b" },
  { id: "futura/general", label: "📁 General", color: "#8b5cf6" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [selectedFolder, setSelectedFolder] = useState("futura/bienes-raices");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async (folder: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cloudinary/assets?folder=${encodeURIComponent(folder)}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch {
      console.error("Error cargando medios");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setAssets([]);
    loadAssets(folder);
  };

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);
    const progress: string[] = [];

    // Get signed upload params
    const signRes = await fetch("/api/cloudinary/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sign", folder: selectedFolder }),
    });
    const params = await signRes.json();

    for (const file of fileArray) {
      progress.push(`⬆️ Subiendo ${file.name}...`);
      setUploadProgress([...progress]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", params.apiKey);
      formData.append("timestamp", params.timestamp.toString());
      formData.append("signature", params.signature);
      formData.append("folder", params.folder);
      if (params.tags) formData.append("tags", params.tags);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (data.secure_url) {
          progress[progress.length - 1] = `✅ ${file.name} listo`;
          setUploadProgress([...progress]);
        } else {
          progress[progress.length - 1] = `❌ ${file.name}: ${data.error?.message || "Error"}`;
          setUploadProgress([...progress]);
        }
      } catch {
        progress[progress.length - 1] = `❌ ${file.name}: Error de red`;
        setUploadProgress([...progress]);
      }
    }

    setUploading(false);
    setTimeout(() => {
      setUploadProgress([]);
      loadAssets(selectedFolder);
    }, 2000);
  }, [selectedFolder, loadAssets]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const folderInfo = FOLDERS.find(f => f.id === selectedFolder);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "Inter, sans-serif", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "24px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>☁️</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Biblioteca de Medios</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Sube y gestiona tus fotos y videos en Cloudinary</p>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Business line selector */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
          {FOLDERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleFolderChange(f.id)}
              style={{
                padding: "10px 20px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "all 0.2s",
                background: selectedFolder === f.id ? f.color : "rgba(255,255,255,0.07)",
                color: selectedFolder === f.id ? "#fff" : "rgba(255,255,255,0.6)",
                boxShadow: selectedFolder === f.id ? `0 0 20px ${f.color}44` : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? folderInfo?.color || "#6366f1" : "rgba(255,255,255,0.15)"}`,
            borderRadius: "20px", padding: "48px", textAlign: "center", cursor: "pointer",
            background: dragOver ? `${folderInfo?.color || "#6366f1"}11` : "rgba(255,255,255,0.03)",
            transition: "all 0.2s", marginBottom: "32px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>
            {uploading ? "⏳" : "📂"}
          </div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "16px", color: uploading ? folderInfo?.color : "rgba(255,255,255,0.8)" }}>
            {uploading ? "Subiendo archivos..." : "Arrastra y suelta aquí"}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            Fotos (JPG, PNG, WEBP) y Videos (MP4, MOV) — Carpeta: {folderInfo?.label}
          </p>

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div style={{ marginTop: "16px", textAlign: "left", background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "12px 16px" }}>
              {uploadProgress.map((msg, i) => (
                <p key={i} style={{ margin: "4px 0", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>{msg}</p>
              ))}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); }}
        />

        {/* Assets grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Cargando tu biblioteca...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖼️</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Sin medios en esta carpeta</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px" }}>Sube tu primera foto o video arriba</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
            {assets.map((asset) => (
              <div
                key={asset.public_id}
                style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {/* Preview */}
                {asset.resource_type === "image" ? (
                  <img
                    src={asset.secure_url}
                    alt={asset.public_id}
                    style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "160px", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
                    🎬
                  </div>
                )}
                {/* Info */}
                <div style={{ padding: "12px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.public_id.split("/").pop()}
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                    {formatBytes(asset.bytes)} • {asset.format?.toUpperCase()}
                    {asset.width && ` • ${asset.width}×${asset.height}`}
                  </p>
                  <button
                    onClick={() => copyUrl(asset.secure_url)}
                    style={{
                      width: "100%", padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: copiedUrl === asset.secure_url ? "#10b981" : "rgba(99,102,241,0.3)",
                      color: "#fff", fontSize: "12px", fontWeight: 600, transition: "background 0.2s",
                    }}
                  >
                    {copiedUrl === asset.secure_url ? "✅ URL copiada" : "📋 Copiar URL"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
