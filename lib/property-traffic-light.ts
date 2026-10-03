/**
 * Property Traffic Light — Futura OS
 * Classifies each property into a color-coded status with a clear action.
 *
 * 🔵 Nueva        — Recién captada. Completar datos y avisar prospectos.
 * 🟡 Mejorar      — Calidad Score < 60 o campos críticos vacíos.
 * 🔴 Atención ya  — Publicada >30 días sin consultas/visitas.
 * 🟢 Va bien      — Tiene consultas o visitas recientes.
 * ⚫ Archivada    — Sin estado comercial o explícitamente cerrada.
 */

export type TrafficColor = "nueva" | "mejorar" | "atencion" | "bien" | "archivada";

export type TrafficLightResult = {
  id: string;
  code: string;
  title: string;
  color: TrafficColor;
  emoji: string;
  label: string;
  action: string;         // What to do
  reason: string;         // Why this classification
  missing: string[];      // Specific missing fields (for 🟡)
  completion: number;     // 0-100 quality score
  daysSincePublished: number;
};

export type TrafficLightSummary = {
  items: TrafficLightResult[];
  counts: Record<TrafficColor, number>;
};

// ─── Input shape (minimal — comes from CatalogProperty or raw fields) ──
export type TrafficLightInput = {
  id: string;
  code: string;
  title: string;
  status: string;           // commercialStatus from Airtable
  completion: number;       // 0-100 quality score
  missing: string[];        // List of missing fields
  photos: string[];         // Array of photo URLs
  price: number;
  summary: string;          // Description text
  zone: string;
  municipality: string;
  publishedAt: string;      // ISO date string or empty
  createdAt: string;        // ISO date string from Airtable createdTime
  hasVisits: boolean;       // Whether property has visits linked
  hasQueries: boolean;      // Whether property has inquiries/leads linked
};

// ─── Constants ────────────────────────────────────────────────────────

const ARCHIVED_STATUSES = ["Archivada", "Cerrada", "Vendida", "Rentada", "Retirada"];
const PUBLISHED_STATUSES = ["Publicada", "En Mercado", "Activa", "En captación"];
const NEW_MAX_DAYS = 7;           // Property is "new" if created within this many days
const STALE_PUBLISHED_DAYS = 30;  // Attention if published > N days without activity
const GOOD_COMPLETION = 60;       // Minimum quality score to be considered "good enough"

const CRITICAL_FIELDS: Array<{ key: keyof TrafficLightInput; label: string }> = [
  { key: "photos",      label: "Fotos" },
  { key: "price",       label: "Precio" },
  { key: "summary",     label: "Descripción" },
  { key: "zone",        label: "Zona/Ubicación" },
];

function daysSince(isoDate: string): number {
  if (!isoDate) return Number.POSITIVE_INFINITY;
  const parsed = new Date(isoDate.slice(0, 10) + "T12:00:00Z").getTime();
  return Number.isFinite(parsed)
    ? Math.floor((Date.now() - parsed) / 86_400_000)
    : Number.POSITIVE_INFINITY;
}

function criticalMissing(prop: TrafficLightInput): string[] {
  const out: string[] = [];
  if (!prop.photos || prop.photos.length === 0) out.push("Fotos");
  if (!prop.price || prop.price <= 0) out.push("Precio");
  if (!prop.summary || prop.summary.trim().length < 20) out.push("Descripción");
  if (!prop.zone && !prop.municipality) out.push("Ubicación");
  return out;
}

// ─── Core classifier ─────────────────────────────────────────────────

export function classifyProperty(prop: TrafficLightInput): TrafficLightResult {
  const age = daysSince(prop.createdAt);
  const publishedAge = daysSince(prop.publishedAt);
  const statusNorm = (prop.status ?? "").trim();
  const missing = [...new Set([...criticalMissing(prop), ...prop.missing])].slice(0, 6);

  // ── ⚫ Archivada ──────────────────────────────────────────────────
  if (ARCHIVED_STATUSES.includes(statusNorm) || (!statusNorm && age > 90)) {
    return build(prop, "archivada", "⚫", "Archivada", "Sin acción requerida por ahora.", `Estado: ${statusNorm || "sin estado"}`, missing, publishedAge);
  }

  // ── 🔵 Nueva ─────────────────────────────────────────────────────
  if (age <= NEW_MAX_DAYS) {
    const hasCritical = missing.length > 0;
    return build(
      prop, "nueva", "🔵", "Nueva",
      hasCritical
        ? `Completa ${missing.join(", ")} y publícala rápido para captar interés inicial.`
        : "Avisa a prospectos que encajen con esta propiedad.",
      `Captada hace ${age} día${age === 1 ? "" : "s"}`,
      missing, publishedAge,
    );
  }

  // ── 🟡 Mejorar ───────────────────────────────────────────────────
  const isBelowQuality = prop.completion < GOOD_COMPLETION || missing.length > 0;
  if (isBelowQuality) {
    const what = missing.length > 0 ? missing.join(", ") : "la calidad general";
    return build(
      prop, "mejorar", "🟡", "Mejorar",
      `Falta: ${what}. Mejorar el perfil aumenta visitas y coincidencias automáticas.`,
      `Quality Score ${prop.completion}%`,
      missing, publishedAge,
    );
  }

  // ── 🔴 Atención ya ───────────────────────────────────────────────
  const isPublished = PUBLISHED_STATUSES.includes(statusNorm);
  const isStale = isPublished && publishedAge > STALE_PUBLISHED_DAYS && !prop.hasVisits && !prop.hasQueries;
  if (isStale) {
    return build(
      prop, "atencion", "🔴", "Atención ya",
      `Lleva ${publishedAge} días publicada sin consultas. Revisa precio, fotos o descripción.`,
      `${publishedAge} días sin actividad`,
      missing, publishedAge,
    );
  }

  // ── 🟢 Va bien ───────────────────────────────────────────────────
  return build(
    prop, "bien", "🟢", "Va bien",
    prop.hasVisits
      ? "Tiene visitas agendadas. Da seguimiento a los prospectos interesados."
      : "Tiene consultas activas. Califica su intención de compra.",
    prop.hasVisits ? "Con visitas agendadas" : "Con consultas activas",
    missing, publishedAge,
  );
}

function build(
  prop: TrafficLightInput,
  color: TrafficColor,
  emoji: string,
  label: string,
  action: string,
  reason: string,
  missing: string[],
  daysSincePublished: number,
): TrafficLightResult {
  return {
    id: prop.id,
    code: prop.code,
    title: prop.title || prop.code || "Propiedad sin título",
    color,
    emoji,
    label,
    action,
    reason,
    missing,
    completion: prop.completion,
    daysSincePublished: Number.isFinite(daysSincePublished) ? daysSincePublished : 0,
  };
}

// ─── Batch classifier ────────────────────────────────────────────────

export function buildTrafficLight(properties: TrafficLightInput[]): TrafficLightSummary {
  const items = properties.map(classifyProperty).sort((a, b) => {
    const order: Record<TrafficColor, number> = { atencion: 0, nueva: 1, mejorar: 2, bien: 3, archivada: 4 };
    return order[a.color] - order[b.color];
  });

  const counts: Record<TrafficColor, number> = { nueva: 0, mejorar: 0, atencion: 0, bien: 0, archivada: 0 };
  for (const item of items) counts[item.color]++;

  return { items, counts };
}
