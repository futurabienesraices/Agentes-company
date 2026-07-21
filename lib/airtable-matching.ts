import { calculateMatches, type Demand, type Property } from "./matching";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;

const TABLES = {
  demands: "tblI0HtmgfOIKzzvs",
  properties: "tblZifOElWQtGaXHM",
  matches: "tbl3wXENYvxuUAR7R",
};

const FIELDS = {
  demands: {
    name: "fld8IM8S3g9oBCONp",
    operation: "fldG7zFdEQMSgMK4i",
    propertyType: "fldyr37i8tbXghWk9",
    location: "fldUGmROgYr3CByJC",
    budgetMax: "fldwLBaTLOJub2Umq",
    budgetMin: "fldf0RzJZ7tpruvcc",
    areaMin: "fldFFhfUm27Mq8TEz",
    bedroomsMin: "fldKuVwZkbC4TewYy",
    bathroomsMin: "fldoKI1KHFGK7vxRT",
    paymentMode: "fldjqa03S4kXfhB2m",
    state: "fldIDXeMa3BPcRKRy",
  },
  properties: {
    code: "fldBHH1Ki3jmVIGwB",
    name: "fldcDIOahahyHurDm",
    commercialStatus: "fldAN7GBFy247BShJ",
    availability: "fldj9molLkGpK6SXR",
    operation: "fldm7rV2anSTjGpgp",
    propertyType: "fldzkccNuERBm2Ybq",
    price: "fldvcBlG4w3yfUYIy",
    area: "fldd6e2CkUyHE3XY1",
  },
  matches: {
    name: "fldcN3S7JuCEMfMBU",
    demand: "fldkqQeJ6yijyuNU4",
    property: "fldErUvbjRMa8QufO",
    score: "fld6wMqUlJQKd2zUj",
    level: "fldOa3LyT35TzuX0P",
    state: "fldkVRk98alu41J1X",
    reasons: "fldtyPRV7eH5wPmaw",
    alerts: "fldTfDGzlSCuCuw7Y",
    calculatedAt: "fld9UcWdRNz4SE52i",
    humanReview: "fldlFnQVKTxOSjWhk",
  },
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };
type AirtableListResponse = { records: AirtableRecord[]; offset?: string };

function requireToken() {
  if (!API_TOKEN) throw new Error("Falta AIRTABLE_API_TOKEN en las variables de entorno.");
  return API_TOKEN;
}

async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable respondió ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

async function listAll(tableId: string, filterByFormula?: string) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    if (filterByFormula) params.set("filterByFormula", filterByFormula);
    const page = await airtableFetch<AirtableListResponse>(`${tableId}?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);
const number = (value: unknown) => (typeof value === "number" ? value : undefined);

function toDemand(record: AirtableRecord): Demand {
  const fields = record.fields;
  return {
    id: record.id,
    name: text(fields[FIELDS.demands.name]) ?? record.id,
    operation: text(fields[FIELDS.demands.operation]),
    propertyType: text(fields[FIELDS.demands.propertyType]),
    location: text(fields[FIELDS.demands.location]),
    budgetMax: number(fields[FIELDS.demands.budgetMax]),
    budgetMin: number(fields[FIELDS.demands.budgetMin]),
    areaMin: number(fields[FIELDS.demands.areaMin]),
    bedroomsMin: number(fields[FIELDS.demands.bedroomsMin]),
    bathroomsMin: number(fields[FIELDS.demands.bathroomsMin]),
    paymentMode: text(fields[FIELDS.demands.paymentMode]),
  };
}

function toProperty(record: AirtableRecord): Property {
  const fields = record.fields;
  return {
    id: record.id,
    code: text(fields[FIELDS.properties.code]) ?? record.id,
    name: text(fields[FIELDS.properties.name]) ?? record.id,
    commercialStatus: text(fields[FIELDS.properties.commercialStatus]),
    availability: text(fields[FIELDS.properties.availability]),
    operation: text(fields[FIELDS.properties.operation]),
    propertyType: text(fields[FIELDS.properties.propertyType]),
    price: number(fields[FIELDS.properties.price]),
    area: number(fields[FIELDS.properties.area]),
  };
}

async function upsertMatches(records: Array<{ fields: Record<string, unknown> }>) {
  for (let index = 0; index < records.length; index += 10) {
    const batch = records.slice(index, index + 10);
    await airtableFetch(TABLES.matches, {
      method: "PATCH",
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: [FIELDS.matches.name] },
        typecast: true,
        records: batch,
      }),
    });
  }
}

export async function recalculateAirtableMatches(demandId?: string) {
  const demandFilter = demandId
    ? `AND(RECORD_ID()='${demandId}', {${FIELDS.demands.state}}!='Cerrada')`
    : `{${FIELDS.demands.state}}='En búsqueda'`;

  const [demandRecords, propertyRecords] = await Promise.all([
    listAll(TABLES.demands, demandFilter),
    listAll(TABLES.properties),
  ]);

  const matches = calculateMatches(
    demandRecords.map(toDemand),
    propertyRecords.map(toProperty),
  );

  const today = new Date().toISOString().slice(0, 10);
  await upsertMatches(
    matches.map((match) => ({
      fields: {
        [FIELDS.matches.name]: match.name,
        [FIELDS.matches.demand]: [match.demandId],
        [FIELDS.matches.property]: [match.propertyId],
        [FIELDS.matches.score]: match.score,
        [FIELDS.matches.level]: match.level,
        [FIELDS.matches.state]: "Sugerida",
        [FIELDS.matches.reasons]: match.reasons.join("\n"),
        [FIELDS.matches.alerts]: match.alerts.join("\n"),
        [FIELDS.matches.calculatedAt]: today,
        [FIELDS.matches.humanReview]: match.humanReviewRequired,
      },
    })),
  );

  return {
    demandsProcessed: demandRecords.length,
    propertiesProcessed: propertyRecords.length,
    matchesUpserted: matches.length,
  };
}
