/**
 * iCalendar Feed Endpoint (.ics) — Futura OS
 * Exposes a calendar subscription feed for iPhone (iOS Calendar) and Google Calendar.
 */

import { NextResponse } from "next/server";
import { getFollowUpData, getVisitData } from "../../../../lib/operations";

export async function GET() {
  try {
    const [followups, visits] = await Promise.all([
      getFollowUpData(),
      getVisitData(),
    ]);

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Futura OS//Agenda Comercial y Seguimiento//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Futura OS - Citas & Seguimientos",
      "X-WR-TIMEZONE:America/El_Salvador",
    ];

    if (followups.queue) {
      followups.queue.forEach((f, idx) => {
        const now = new Date();
        const dtStart = new Date(now.getTime() + idx * 86400000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const dtEnd = new Date(now.getTime() + idx * 86400000 + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:futura-followup-${f.id}-${idx}@futuraos.com`,
          `DTSTAMP:${dtStart}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:📞 Seguimiento: ${f.name}`,
          `DESCRIPTION:Estado: ${f.status}\\nPróxima acción: ${f.nextAction}`,
          "STATUS:CONFIRMED",
          "END:VEVENT"
        );
      });
    }

    if (visits.items) {
      visits.items.forEach((v, idx) => {
        const now = new Date();
        const dtStart = new Date(now.getTime() + (idx + 1) * 86400000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const dtEnd = new Date(now.getTime() + (idx + 1) * 86400000 + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        icsContent.push(
          "BEGIN:VEVENT",
          `UID:futura-visit-${v.id}-${idx}@futuraos.com`,
          `DTSTAMP:${dtStart}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:🏠 Visita: ${v.name}`,
          `DESCRIPTION:Estado: ${v.status}`,
          "STATUS:CONFIRMED",
          "END:VEVENT"
        );
      });
    }

    icsContent.push("END:VCALENDAR");

    return new Response(icsContent.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="futura-agenda.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
