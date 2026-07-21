const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  properties: "tblZifOElWQtGaXHM",
  demands: "tblI0HtmgfOIKzzvs",
  matches: "tbl3wXENYvxuUAR7R",
};

const FIELDS = {
  properties: {
    name: "fldcDIOahahyHurDm",
    code: "fldBHH1Ki3jmVIGwB",
    status: "fldAN7GBFy247BShJ",
    preparation: "fldMEZNUrfGqkbd0v",
    missing: "fldcTVWJJ2USr5Lmq",
  },
  demands: {
    name: "fld8IM8S3g9oBCONp",
    state: "fldIDXeMa3BPcRKRy",
  },
  matches: {
    name: "fldcN3S7JuCEMfMBU",
    score: "fld6wMqUlJQKd2zUj",
    level: "fldOa3LyT35TzuX0P",
    state: "fldkVRk98alu41J1X",
    reasons: "fldtyPRV7eH5wPmaw",
    alerts: "fldTfDGzlSCuCuw7Y",
  },
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };
type AirtableResponse = { records: AirtableRecord[]; offset?: string };

async function listAll(tableId: string) {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN");
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) params.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Airtable respondió ${response.status}`);
    const page = (await response.json()) as AirtableResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

const text = (fields: Record<string, unknown>, id: string) =>
  typeof fields[id] === "string" ? (fields[id] as string) : "";
const number = (fields: Record<string, unknown>, id: string) =>
  typeof fields[id] === "number" ? (fields[id] as number) : 0;

export async function getCaptadorData() {
  try {
    const properties = await listAll(TABLES.properties);
    const incomplete = properties
      .filter((record) => Boolean(text(record.fields, FIELDS.properties.missing)))
      .map((record) => ({
        id: record.id,
        name: text(record.fields, FIELDS.properties.name) || text(record.fields, FIELDS.properties.code) || "Propiedad sin nombre",
        missing: text(record.fields, FIELDS.properties.missing),
        preparation: text(record.fields, FIELDS.properties.preparation) || "Sin evaluar",
      }))
      .slice(0, 12);

    return { connected: true, total: properties.length, incomplete };
  } catch {
    return { connected: false, total: 0, incomplete: [] as Array<{ id: string; name: string; missing: string; preparation: string }> };
  }
}

export async function getCommercialData() {
  try {
    const [matches, demands] = await Promise.all([listAll(TABLES.matches), listAll(TABLES.demands)]);
    const activeDemands = demands.filter((record) => ["Activa", "En búsqueda"].includes(text(record.fields, FIELDS.demands.state)));
    const queue = matches
      .map((record) => ({
        id: record.id,
        name: text(record.fields, FIELDS.matches.name) || "Coincidencia sin nombre",
        score: number(record.fields, FIELDS.matches.score),
        level: text(record.fields, FIELDS.matches.level) || "Sin nivel",
        state: text(record.fields, FIELDS.matches.state) || "Sugerida",
        reasons: text(record.fields, FIELDS.matches.reasons),
        alerts: text(record.fields, FIELDS.matches.alerts),
      }))
      .filter((item) => !["Descartada", "Cerrada"].includes(item.state))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return { connected: true, activeDemands: activeDemands.length, queue };
  } catch {
    return { connected: false, activeDemands: 0, queue: [] as Array<{ id: string; name: string; score: number; level: string; state: string; reasons: string; alerts: string }> };
  }
}
