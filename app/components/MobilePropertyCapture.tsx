"use client";

import { FormEvent, useState, useEffect } from "react";

type UploadedAsset = {
  url: string;
  publicId?: string;
  name: string;
  type: "image" | "video";
};

export default function MobilePropertyCapture() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [operation, setOperation] = useState("Venta");
  const [propertyType, setPropertyType] = useState("Casa");
  const [location, setLocation] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [department, setDepartment] = useState("San Salvador");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [parking, setParking] = useState("");
  const [details, setDetails] = useState("");
  const [legalDocs, setLegalDocs] = useState(false);

  // GPS Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Voice Dictation
  const [isListening, setIsListening] = useState(false);

  // Media Assets
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // GPS Acquisition
  function getGpsLocation() {
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada en este navegador.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        alert(`Error al obtener ubicación: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Voice Dictation Handler
  function toggleVoiceRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("El dictado por voz no está soportado en este navegador. Usa Chrome o Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-SV";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setDetails((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.start();
  }

  // Media Upload Handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);

    const uploads = Array.from(files).map(
      (file) =>
        new Promise<void>((resolve) => {
          const isVideo = file.type.startsWith("video/");
          const reader = new FileReader();

          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const res = await fetch("/api/cloudinary/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "upload_base64",
                  base64,
                  folder: "futura/bienes-raices",
                  tags: ["captura-movil", propertyType.toLowerCase()],
                }),
              });
              const data = await res.json();
              if (data.asset?.secure_url) {
                setAssets((prev) => [
                  ...prev,
                  {
                    url: data.asset.secure_url,
                    publicId: data.asset.public_id,
                    name: file.name,
                    type: isVideo ? "video" : "image",
                  },
                ]);
              } else {
                throw new Error(data.error || "Sin URL");
              }
            } catch {
              // Fallback: preview local si Cloudinary no está configurado
              const localUrl = URL.createObjectURL(file);
              setAssets((prev) => [
                ...prev,
                { url: localUrl, name: file.name, type: isVideo ? "video" : "image" },
              ]);
            }
            resolve();
          };

          reader.onerror = () => resolve(); // no bloquear si falla la lectura
          reader.readAsDataURL(file);
        })
    );

    await Promise.all(uploads);
    setUploadingMedia(false);
  }

  function removeAsset(index: number) {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculate Quality Score (0 - 100%)
  function calculateQualityScore() {
    let score = 0;
    if (ownerName && (ownerPhone || ownerEmail)) score += 20;
    if (location && department) score += 15;
    if (expectedPrice) score += 15;
    if (area || bedrooms || bathrooms) score += 15;
    if (details.length > 20) score += 15;
    if (assets.length >= 1) score += 10;
    if (assets.length >= 3) score += 5;
    if (coords) score += 5;
    return Math.min(100, score);
  }

  const qualityScore = calculateQualityScore();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading || uploadingMedia) return;
    setLoading(true);
    setStatus("");

    try {
      const photoUrls = assets.map((a) => a.url).join(",");

      const response = await fetch("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ownerName || title || "Captura Móvil",
          phone: ownerPhone,
          email: ownerEmail,
          operation,
          propertyType,
          location: coords ? `${location} (GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` : location,
          municipality,
          department,
          expectedPrice,
          area,
          bedrooms,
          bathrooms,
          parking,
          message: details,
          legalDocs,
          photos: photoUrls,
          coords: coords ? true : false, // for quality score calculation
          consent: true,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al registrar la propiedad.");

      setReference(result.reference || "");
      setStatus(`Ficha registrada en Airtable${photoUrls ? ` con ${assets.length} foto(s) en Cloudinary.` : "."}`);
      setSent(true);
    } catch (err: any) {
      setStatus(err.message || "Ocurrió un error insospechado.");
    } finally {
      setLoading(false);
    }
  }


  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "30px 16px", background: "#fff", borderRadius: 20 }}>
        <div style={{ width: 64, height: 64, background: "#10b981", color: "#fff", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 32 }}>✓</div>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>¡Propiedad Capturada!</h2>
        <p style={{ color: "#6b7280" }}>{status}</p>
        {reference && <p style={{ fontWeight: "bold" }}>Referencia: {reference}</p>}
        <button
          onClick={() => {
            setSent(false);
            setAssets([]);
            setDetails("");
            setCoords(null);
          }}
          style={{ marginTop: 16, background: "#0071e3", color: "#fff", border: 0, padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Capturar otra propiedad
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Quality Score Bar */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 750, color: "#334155" }}>Calidad de Ficha en Campo</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 900, color: qualityScore >= 80 ? "#10b981" : qualityScore >= 50 ? "#f59e0b" : "#ef4444" }}>
            {qualityScore}%
          </span>
        </div>
        <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${qualityScore}%`,
              height: "100%",
              background: qualityScore >= 80 ? "#10b981" : qualityScore >= 50 ? "#f59e0b" : "#ef4444",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <small style={{ color: "#64748b", fontSize: "0.75rem", display: "block", marginTop: 6 }}>
          {qualityScore < 50 ? "Faltan datos básicos (Fotos, precio o detalles)" : qualityScore < 80 ? "Ficha aceptable · Agrega fotos o voz para 100%" : "¡Ficha completa y lista para publicación!"}
        </small>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        {/* Step 1: Photos & Video Capture */}
        <div style={{ background: "#fff", border: "1px solid #e1e5ec", borderRadius: 18, padding: 18 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📸</span> Fotografías y Videos
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <label
              style={{
                display: "grid",
                placeItems: "center",
                width: 100,
                height: 100,
                border: "2px dashed #0071e3",
                borderRadius: 14,
                background: "#f0f7ff",
                color: "#0071e3",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              <span>📷 Tomar foto / Elegir</span>
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>

            {assets.map((asset, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  background: "#000",
                }}
              >
                {asset.type === "video" ? (
                  <video src={asset.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={asset.url} alt="Captura" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <button
                  type="button"
                  onClick={() => removeAsset(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    border: 0,
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {uploadingMedia && <p style={{ fontSize: "0.8rem", color: "#0071e3" }}>Subiendo multimedia a Cloudinary…</p>}
        </div>

        {/* Step 2: Voice Dictation & Location GPS */}
        <div style={{ background: "#fff", border: "1px solid #e1e5ec", borderRadius: 18, padding: 18, display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🎤</span> Dictado por Voz y GPS
          </h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              style={{
                flex: 1,
                minHeight: 46,
                border: "1px solid " + (isListening ? "#ef4444" : "#0071e3"),
                borderRadius: 12,
                background: isListening ? "#fef2f2" : "#f0f7ff",
                color: isListening ? "#ef4444" : "#0071e3",
                fontWeight: 750,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>{isListening ? "🔴 Grabando… Toca para parar" : "🎤 Dictar nota de voz"}</span>
            </button>

            <button
              type="button"
              onClick={getGpsLocation}
              disabled={gpsLoading}
              style={{
                flex: 1,
                minHeight: 46,
                border: "1px solid #10b981",
                borderRadius: 12,
                background: "#ecfdf5",
                color: "#059669",
                fontWeight: 750,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>{gpsLoading ? "Obteniendo GPS…" : coords ? "📍 GPS Fijado ✓" : "📍 Usar GPS Actual"}</span>
            </button>
          </div>

          <label style={{ display: "grid", gap: 6, fontSize: "0.8rem", fontWeight: 700 }}>
            Detalles dictados o notas del inmueble
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Describe lo observado en la visita: estado, acabados, motivo de venta, extras…"
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d0d5dd", font: "inherit" }}
            />
          </label>
        </div>

        {/* Step 3: Structured Property Data */}
        <div style={{ background: "#fff", border: "1px solid #e1e5ec", borderRadius: 18, padding: 18, display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>🏠 Datos Estructurados</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Operación
              <select value={operation} onChange={(e) => setOperation(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px" }}>
                <option>Venta</option>
                <option>Alquiler</option>
                <option>Venta/Alquiler</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Tipo de Inmueble
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px" }}>
                <option>Casa</option>
                <option>Apartamento</option>
                <option>Terreno</option>
                <option>Local comercial</option>
                <option>Oficina</option>
                <option>Bodega</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
            Ubicación / Colonia
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Col. Escalón, Residencial Los Sueños"
              required
              style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Precio ($ USD)
              <input
                type="number"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="150000"
                style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Área m²
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="200"
                style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Habitaciones
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
                style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 10px" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Nombre de Contacto / Propietario
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nombre del propietario"
                style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 700 }}>
              Teléfono / WhatsApp
              <input
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="7890-1234"
                style={{ height: 44, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploadingMedia}
          style={{
            height: 52,
            borderRadius: 14,
            background: uploadingMedia ? "#94a3b8" : "#0071e3",
            color: "#fff",
            fontWeight: 850,
            fontSize: "1rem",
            border: 0,
            cursor: loading || uploadingMedia ? "wait" : "pointer",
            boxShadow: "0 4px 14px rgba(0,113,227,0.3)",
            transition: "background .2s",
          }}
        >
          {uploadingMedia
            ? `📤 Subiendo ${assets.length} foto(s)…`
            : loading
              ? "Registrando Ficha…"
              : "🚀 Guardar Propiedad en Airtable"}
        </button>

        {status && (
          <p style={{ color: status.includes("registrada") ? "#16a34a" : "#ef4444", fontSize: "0.85rem", textAlign: "center" }}>
            {status}
          </p>
        )}

      </form>
    </div>
  );
}
