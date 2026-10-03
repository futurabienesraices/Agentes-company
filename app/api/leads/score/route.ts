/**
 * Lead Scoring & Commercial Intelligence API — Futura OS
 * Calculates lead priority scores (0-100%) and recommendations for action today.
 */

import { NextResponse } from "next/server";
import { getSalesCockpit } from "../../../../lib/sales";

export async function GET() {
  try {
    const cockpit = await getSalesCockpit();

    const scoredLeads = cockpit.pendingLeads.map((lead) => {
      let score = 50; // base score

      if (lead.priority === "Alta" || lead.priority === "Urgente") score += 30;
      if (lead.priority === "Media") score += 15;
      if (lead.detail.includes("WhatsApp")) score += 10;
      if (lead.detail.includes("Llamada")) score += 10;

      return {
        ...lead,
        score: Math.min(100, score),
        recommendedAction: score >= 80 ? "🔥 Contactar hoy mismo vía WhatsApp" : score >= 60 ? "📞 Programar llamada comercial" : "💬 Enviar mensaje de seguimiento",
      };
    }).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      connected: cockpit.connected,
      totalPending: scoredLeads.length,
      scoredLeads,
      actionsToday: cockpit.actions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
