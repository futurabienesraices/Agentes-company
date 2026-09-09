import { NextResponse } from "next/server";
import {
  auditInventoryHealth,
  batchUpdateStatus,
  attachMediaToProperty,
} from "../../../lib/agents/inventory-cleanup-agent";

export async function GET() {
  try {
    const report = await auditInventoryHealth();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error en GET /api/inventory-cleanup:", error);
    return NextResponse.json(
      { error: "Error al auditar el inventario.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "batch_status_update") {
      const { propertyIds, newStatus } = body;
      if (!Array.isArray(propertyIds) || !propertyIds.length || !newStatus) {
        return NextResponse.json(
          { error: "Se requieren 'propertyIds' y 'newStatus'." },
          { status: 400 }
        );
      }
      const res = await batchUpdateStatus(propertyIds, newStatus);
      return NextResponse.json({ success: true, ...res });
    }

    if (action === "attach_media") {
      const { propertyId, mediaUrls, driveUrl } = body;
      if (!propertyId) {
        return NextResponse.json({ error: "Se requiere 'propertyId'." }, { status: 400 });
      }
      const res = await attachMediaToProperty(propertyId, mediaUrls || [], driveUrl);
      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
  } catch (error) {
    console.error("Error en POST /api/inventory-cleanup:", error);
    return NextResponse.json(
      { error: "Fallo al procesar la depuración del inventario.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
