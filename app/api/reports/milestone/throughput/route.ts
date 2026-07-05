import { NextResponse } from "next/server";

import {
  fetchMilestoneThroughputReport,
  type MilestoneThroughputResponse,
} from "@/lib/dashboard/milestone-report";
import { parseFlowGranularity } from "@/lib/dashboard/flow-report-params";
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

  const granularity = parseFlowGranularity(url.searchParams.get("granularity"));

  try {
    const body: MilestoneThroughputResponse = await fetchMilestoneThroughputReport(
      milestoneIid,
      granularity,
    );
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
