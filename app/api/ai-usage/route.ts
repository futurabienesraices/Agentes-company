import { NextResponse } from "next/server";
import { getAiBudget } from "../../../lib/ai-usage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAiBudget(), { headers: { "Cache-Control": "no-store" } });
}
