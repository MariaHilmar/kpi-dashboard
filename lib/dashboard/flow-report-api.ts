import { NextResponse } from "next/server";

import { handleFlowReportRequest } from "@/lib/dashboard/flow-report";
import { getSessionUser } from "@/lib/supabase/session";

export {
  fetchFlowBottlenecks,
  fetchFlowCfd,
  fetchFlowDataQuality,
  fetchFlowLeadTime,
  fetchFlowStageDwell,
  fetchFlowThroughput,
  fetchFlowWip,
  fetchFlowWorkItemAge,
  parseFlowGranularity,
} from "@/lib/dashboard/flow-report";

export async function flowReportRoute(
  request: Request,
  loader: Parameters<typeof handleFlowReportRequest>[1],
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await handleFlowReportRequest(request, loader);
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatório.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
