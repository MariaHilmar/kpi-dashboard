import { NextResponse } from "next/server";

import { requireActiveSession } from "@/lib/auth/profile";
import { buildPlanningPokerTemplateWorkbook } from "@/lib/dashboard/planning-poker-import";

export async function GET() {
  const auth = await requireActiveSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const buffer = await buildPlanningPokerTemplateWorkbook();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="planning_poker_import.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
