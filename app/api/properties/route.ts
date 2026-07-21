import { NextRequest, NextResponse } from "next/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "app7dn7435WA9fa7R";
const API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const TABLE_ID = "tblZifOElWQtGaXHM";

const FIELDS = {
  code: "fldBHH1Ki3jmVIGwB",
  name: "fldcDIOahahyHurDm",
  commercialStatus: "fldAN7GBFy247BShJ",
  operation: "fldm7rV2anSTjGpgp",
  propertyType: "fldzkccNuERBm2Ybq",
  price: "fldvcBlG4w3yfUYIy",
  area: "fldd6e2CkUyHE3XY1",
  preparation: "fldMEZNUrfGqkbd0v",
  missing: "fldcTVWJJ2USr5Lmq",
};

export async function POST(request: NextRequest) {
  if (!API_TOKEN) return NextResponse.json({ error: "Airtable no está configurado." }, { status: 503 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const operation = typeof body.operation === "string" ? body.operation.trim() : "";
    const propertyType = typeof body.propertyType === "string" ? body.propertyType.trim() : "";
    const price = Number(body.price);
    const area = Number(body.area);

    if (!name || !code || !operation || !propertyType || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Completa nombre, código, operación, tipo y precio." }, { status: 400 });
    }

    const missing = [
      !Number.isFinite(area) || area <= 0 ? "Área" : "",
    ].filter(Boolean);

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typecast: true,
        records: [{
          fields: {
            [FIELDS.code]: code,
            [FIELDS.name]: name,
            [FIELDS.commercialStatus]: "Captación",
            [FIELDS.operation]: operation,
            [FIELDS.propertyType]: propertyType,
            [FIELDS.price]: price,
            ...(Number.isFinite(area) && area > 0 ? { [FIELDS.area]: area } : {}),
            [FIELDS.preparation]: missing.length ? "Incompleta" : "Lista para revisión",
            [FIELDS.missing]: missing.join(", "),
          },
        }],
      }),
    });

    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Airtable rechazó la propiedad.", detail: result }, { status: response.status });

    return NextResponse.json({ ok: true, record: result.records?.[0], missing });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible crear la propiedad." }, { status: 500 });
  }
}
