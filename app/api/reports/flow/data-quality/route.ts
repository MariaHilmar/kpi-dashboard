import { fetchFlowDataQuality, flowReportRoute } from "@/lib/dashboard/flow-report-api";

export async function GET(request: Request) {
  return flowReportRoute(request, async (filters) => {
    const row = await fetchFlowDataQuality(filters);
    return row;
  });
}
