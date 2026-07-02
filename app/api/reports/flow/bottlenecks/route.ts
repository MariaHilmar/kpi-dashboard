import { fetchFlowBottlenecks, flowReportRoute } from "@/lib/dashboard/flow-report-api";

export async function GET(request: Request) {
  return flowReportRoute(request, (filters) => fetchFlowBottlenecks(filters));
}
