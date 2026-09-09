import { NextResponse } from "next/server";
import {
  ingestSocialPost,
  auditSocialPost,
  generateAmplificationAssets,
} from "../../../lib/agents/social-amplifier-agent";
import { scoreMatch, type Demand, type Property } from "../../../lib/matching";
import { TABLES, FIELD, listAll, text, num, createRecord } from "../../../lib/airtable-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawPostText, mediaUrls, saveToAirtable } = body;

    if (!rawPostText || typeof rawPostText !== "string" || rawPostText.trim().length === 0) {
      return NextResponse.json(
        { error: "Se requiere el texto de la publicación ('rawPostText')." },
        { status: 400 }
      );
    }

    // 1. Extracción e ingesta con IA
    const ingestedProperty = await ingestSocialPost(rawPostText, mediaUrls);

    // 2. Diagnóstico de desempeño del post actual
    const audit = await auditSocialPost(ingestedProperty, rawPostText);

    // 3. Obtener demandas activas de compradores desde Airtable para encontrar matches reales
    let matchedDemands: Array<{ id: string; name: string; score: number; level: string; reasons: string[] }> = [];

    try {
      const demandRecords = await listAll(TABLES.demands);
      const demands: Demand[] = demandRecords.map((r: { id: string; fields: Record<string, unknown> }) => {
        const f = r.fields;
        return {
          id: r.id,
          name: text(f, FIELD.demands.name) || r.id,
          operation: text(f, FIELD.demands.operation),
          propertyType: text(f, FIELD.demands.propertyType),
          location: text(f, FIELD.demands.location),
          budgetMax: num(f, FIELD.demands.budgetMax),
          budgetMin: num(f, FIELD.demands.budgetMin),
          areaMin: num(f, FIELD.demands.areaMin),
          bedroomsMin: num(f, FIELD.demands.bedroomsMin),
          bathroomsMin: num(f, FIELD.demands.bathroomsMin),
        };
      });

      const tempProp: Property = {
        id: "temp_ingested",
        code: "PROP-REDES",
        name: ingestedProperty.title,
        operation: ingestedProperty.operation,
        propertyType: ingestedProperty.propertyType,
        location: ingestedProperty.location,
        price: ingestedProperty.price,
        area: ingestedProperty.area,
        commercialStatus: "Disponible",
      };

      const rawMatches = demands
        .map((d) => scoreMatch(d, tempProp))
        .filter((m): m is NonNullable<ReturnType<typeof scoreMatch>> => Boolean(m))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      matchedDemands = rawMatches.map((m) => ({
        id: m.demandId,
        name: m.name,
        score: m.score,
        level: m.level,
        reasons: m.reasons,
      }));
    } catch (err) {
      console.warn("No se pudieron consultar demandas en Airtable:", err);
    }

    // 4. Generar paquete de amplificación multi-canal
    const amplificationPackage = await generateAmplificationAssets(
      ingestedProperty,
      matchedDemands.map((m) => ({ id: m.id, name: m.name, score: m.score }))
    );

    // 5. Opcional: Guardar en Airtable si el usuario lo requiere
    let createdAirtableId: string | null = null;
    if (saveToAirtable) {
      try {
        const created = await createRecord(TABLES.properties, {
          [FIELD.properties.title]: ingestedProperty.title,
          [FIELD.properties.price]: ingestedProperty.price ?? 0,
          [FIELD.properties.zone]: ingestedProperty.location ?? "",
          [FIELD.properties.type]: ingestedProperty.propertyType ?? "Casa",
          [FIELD.properties.operation]: ingestedProperty.operation ?? "Venta",
          [FIELD.properties.bedrooms]: ingestedProperty.bedrooms ?? 0,
          [FIELD.properties.bathrooms]: ingestedProperty.bathrooms ?? 0,
          [FIELD.properties.area]: ingestedProperty.area ?? 0,
          [FIELD.properties.amenities]: ingestedProperty.amenities?.join(", ") ?? "",
          [FIELD.properties.summary]: ingestedProperty.rawSummary ?? rawPostText,
          [FIELD.properties.commercialStatus]: "Lista para publicar",
        });
        createdAirtableId = created.id;
      } catch (err) {
        console.warn("Error guardando propiedad en Airtable:", err);
      }
    }

    return NextResponse.json({
      success: true,
      ingestedProperty,
      audit,
      matchedDemands,
      amplificationPackage,
      createdAirtableId,
    });
  } catch (error) {
    console.error("Error en POST /api/social-amplifier:", error);
    return NextResponse.json(
      {
        error: "Fallo al procesar la publicación en el Agente de Redes.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
