"use client";

import { useState } from "react";

type IngestedProperty = {
  title: string;
  price?: number;
  location?: string;
  propertyType?: string;
  operation?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: string[];
  rawSummary?: string;
  missingFields: string[];
  completenessScore: number;
};

type PostAudit = {
  overallScore: number;
  copyRating: "Excelente" | "Aceptable" | "Deficiente";
  ctaRating: "Fuerte" | "Débil" | "Ausente";
  leadMagnetPresent: boolean;
  bottlenecks: string[];
  recommendedFixes: string[];
  conversionStrategy: string;
};

type MatchedDemand = {
  id: string;
  name: string;
  score: number;
  level: string;
  reasons: string[];
};

type AmplificationPackage = {
  reelScript: {
    hook: string;
    body: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  whatsAppBroadcast: string;
  facebookMarketplaceCopy: string;
  leadMagnetKeyword: string;
  directOutreachTemplates: Array<{
    buyerName: string;
    buyerDemandId: string;
    matchScore: number;
    personalizedMessage: string;
  }>;
};

type ApiResponse = {
  success: boolean;
  ingestedProperty: IngestedProperty;
  audit: PostAudit;
  matchedDemands: MatchedDemand[];
  amplificationPackage: AmplificationPackage;
  createdAirtableId?: string;
};

type MetaPostItem = {
  id: string;
  caption?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
};

export default function SocialAmplifier() {
  const [rawPostText, setRawPostText] = useState("");
  const [saveToAirtable, setSaveToAirtable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"audit" | "matches" | "package">("audit");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Meta API states
  const [metaPosts, setMetaPosts] = useState<MetaPostItem[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  const handleFetchMetaPosts = async () => {
    setFetchingMeta(true);
    setMetaError(null);
    try {
      const res = await fetch("/api/meta/posts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo conectar con Meta.");

      if (json.instagram?.posts && json.instagram.posts.length > 0) {
        setMetaPosts(json.instagram.posts);
      } else {
        setMetaError("Se conectó a Meta pero no se encontraron posts de Instagram recien publicados.");
      }
      setMetaLoaded(true);
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : "Error al conectar con la API de Meta.");
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleSelectMetaPost = (post: MetaPostItem) => {
    if (post.caption) {
      setRawPostText(post.caption);
    }
  };

  const handleAnalyze = async () => {
    if (!rawPostText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/social-amplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPostText, saveToAirtable }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al procesar la publicación.");

      setData(json);
      setActiveTab("audit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
            <span>⚡ Futura AI</span>
            <span>•</span>
            <span>Agente de Redes y Exponenciación</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Multiplica el Alcance y Venta de tus Publicaciones
          </h2>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl">
            Pega el texto de cualquier publicación existente de redes (Instagram, Facebook, TikTok).
            El agente diagnosticará por qué no ha generado ventas, extraerá los datos, cruzará con compradores activos y generará un paquete de amplificación multi-canal.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Meta Direct Integration Bar */}
        <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📸</span>
              <div>
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                  Conexión Directa Meta (Instagram & Facebook API)
                </span>
                <p className="text-xs text-purple-750">
                  Importa publicaciones recientes de tu cuenta directamente sin necesidad de copiar y pegar.
                </p>
              </div>
            </div>

            <button
              onClick={handleFetchMetaPosts}
              disabled={fetchingMeta}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {fetchingMeta ? "Cargando desde Meta..." : "🔄 Cargar Posts Recientes de Instagram"}
            </button>
          </div>

          {metaError && (
            <div className="p-2.5 bg-rose-100/80 text-rose-800 text-xs font-medium rounded-lg">
              ⚠️ {metaError}
            </div>
          )}

          {metaLoaded && metaPosts.length > 0 && (
            <div className="pt-2 border-t border-purple-200/60 space-y-2">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                Selecciona un post para analizar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {metaPosts.slice(0, 6).map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelectMetaPost(post)}
                    className="p-2.5 bg-white border border-purple-200 hover:border-purple-500 rounded-xl text-left transition-all text-xs space-y-1 hover:shadow-md"
                  >
                    <span className="font-bold text-purple-900 block truncate">
                      {post.caption ? post.caption.slice(0, 45) + "..." : "Post sin texto"}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : "Instagram"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="block text-sm font-semibold text-slate-900">
          Publicación de Redes Sociales (Copy o Descripción Actual)
        </label>
        <textarea
          rows={5}
          value={rawPostText}
          onChange={(e) => setRawPostText(e.target.value)}
          placeholder="Ej: Se vende hermosa casa de 3 habitaciones en San Benito, cuenta con cochera para 2 vehículos, piscina y seguridad 24/7. Precio $250,000. Para más información enviar mensaje al privado..."
          className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 placeholder-slate-400 font-mono"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs md:text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToAirtable}
              onChange={(e) => setSaveToAirtable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Guardar/Actualizar automáticamente como ficha en inventario CRM</span>
          </label>

          <button
            onClick={handleAnalyze}
            disabled={loading || !rawPostText.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analizando y Generando Exponenciación...</span>
              </>
            ) : (
              <>
                <span>🚀 Analizar y Exponenciar</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results Dashboard */}
      {data && (
        <div className="space-y-6">
          {/* Property Summary Header */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
                Ficha Extraída
              </span>
              <h3 className="text-xl font-bold">{data.ingestedProperty.title}</h3>
              <p className="text-xs text-slate-300 mt-1">
                📍 {data.ingestedProperty.location || "Sin ubicación"} | 🏠 {data.ingestedProperty.propertyType} | 💰{" "}
                {data.ingestedProperty.price ? `$${data.ingestedProperty.price.toLocaleString()}` : "No especificado"}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Completitud Ficha:</span>
              <span className="text-lg font-bold text-emerald-400">
                {data.ingestedProperty.completenessScore}%
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "audit"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Diagnóstico de Conversión ({data.audit.overallScore}/100)
            </button>

            <button
              onClick={() => setActiveTab("matches")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === "matches"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>🎯 Compradores Coincidentes</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {data.matchedDemands.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("package")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "package"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              ⚡ Paquete de Exponenciación Multi-Canal
            </button>
          </div>

          {/* TAB 1: AUDIT */}
          {activeTab === "audit" && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                  <span>🚨 Puntos de Fricción Identificados</span>
                </h4>
                <div className="space-y-2">
                  {data.audit.bottlenecks.map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs md:text-sm flex gap-3">
                      <span>⚠️</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                  <span>✅ Acciones Recomendadas para Convertir</span>
                </h4>
                <div className="space-y-2">
                  {data.audit.recommendedFixes.map((item, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs md:text-sm flex gap-3">
                      <span>💡</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-6">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                  🎯 Estrategia de Embudo recomendada
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {data.audit.conversionStrategy}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CRM MATCHES */}
          {activeTab === "matches" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-lg">
                Compradores Registrados Interesados en esta Propiedad
              </h4>
              <p className="text-xs text-slate-500">
                Coincidencias calculadas automáticamente comparando precio, ubicación y características contra la base de clientes en Airtable.
              </p>

              {data.matchedDemands.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl text-sm">
                  No se encontraron compradores activos que coincidan al 100% en este momento. Puedes usar el paquete de exponenciación para captar nuevos prospectos.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.matchedDemands.map((match) => {
                    const outreach = data.amplificationPackage.directOutreachTemplates.find(
                      (t) => t.buyerDemandId === match.id
                    );

                    return (
                      <div
                        key={match.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm md:text-base">
                            👤 {match.name}
                          </span>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                            Coincidencia {match.score}% ({match.level})
                          </span>
                        </div>

                        <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                          {match.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>

                        {outreach && (
                          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-mono text-slate-500 truncate max-w-md">
                              "{outreach.personalizedMessage.slice(0, 75)}..."
                            </span>
                            <button
                              onClick={() => copyToClipboard(outreach.personalizedMessage, `match_${match.id}`)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all"
                            >
                              {copiedField === `match_${match.id}` ? "✓ Copiado" : "📲 Copiar Mensaje WhatsApp"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AMPLIFICATION ASSETS */}
          {activeTab === "package" && (
            <div className="space-y-6">
              {/* Reel Script */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🎬 Guion de Reel / TikTok (15 Segundos)</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `HOOK:\n${data.amplificationPackage.reelScript.hook}\n\nDESARROLLO:\n${data.amplificationPackage.reelScript.body}\n\nCTA:\n${data.amplificationPackage.reelScript.cta}\n\nCAPTION:\n${data.amplificationPackage.reelScript.caption}`,
                        "reel"
                      )
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
                  >
                    {copiedField === "reel" ? "✓ Guion Copiado" : "📋 Copiar Guion"}
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-blue-700 uppercase">1. Gancho (0-3s)</span>
                    <p className="text-xs text-blue-950 font-semibold">{data.amplificationPackage.reelScript.hook}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-slate-700 uppercase">2. Contenido (3-12s)</span>
                    <p className="text-xs text-slate-900">{data.amplificationPackage.reelScript.body}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-emerald-700 uppercase">3. Llamado a Acción (12-15s)</span>
                    <p className="text-xs text-emerald-950 font-semibold">{data.amplificationPackage.reelScript.cta}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 font-mono">
                  <span className="text-blue-400 font-bold">Copy sugerido para la publicación:</span>
                  <p>{data.amplificationPackage.reelScript.caption}</p>
                  <p className="text-slate-400">{data.amplificationPackage.reelScript.hashtags.join(" ")}</p>
                </div>
              </div>

              {/* WhatsApp Broadcast */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>📲 Difusión para WhatsApp / Telegram</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(data.amplificationPackage.whatsAppBroadcast, "wa")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                  >
                    {copiedField === "wa" ? "✓ Mensaje Copiado" : "📋 Copiar Texto WhatsApp"}
                  </button>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs md:text-sm font-sans whitespace-pre-line text-emerald-950">
                  {data.amplificationPackage.whatsAppBroadcast}
                </div>
              </div>

              {/* Facebook Marketplace */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🏪 Copy Optimizado para Facebook Marketplace</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard(data.amplificationPackage.facebookMarketplaceCopy, "fb")}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                  >
                    {copiedField === "fb" ? "✓ Copy Copiado" : "📋 Copiar Copy Marketplace"}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 font-mono whitespace-pre-line">
                  {data.amplificationPackage.facebookMarketplaceCopy}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
