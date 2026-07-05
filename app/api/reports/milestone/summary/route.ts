import { NextResponse } from "next/server";

import {
  fetchMilestoneMix,
  fetchMilestoneSummary,
  fetchMilestoneWip,
} from "@/lib/dashboard/milestone-report";
import { getSessionUser } from "@/lib/supabase/session";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const iidRaw = url.searchParams.get("iid");
  const milestoneIid = iidRaw ? Number(iidRaw) : NaN;

  if (!Number.isInteger(milestoneIid) || milestoneIid <= 0) {
    return NextResponse.json({ error: "Parâmetro iid inválido." }, { status: 400 });
  }

  try {
    const [summary, wip, mixTipo] = await Promise.all([
      fetchMilestoneSummary(milestoneIid),
      fetchMilestoneWip(milestoneIid),
      fetchMilestoneMix(milestoneIid, "tipo"),
    ]);

    return NextResponse.json({ summary, wip, mix: { tipo: mixTipo } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
