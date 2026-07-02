import { fetchFlowWorkItemAge, flowReportRoute } from "@/lib/dashboard/flow-report-api";

export async function GET(request: Request) {
  return flowReportRoute(request, (filters, url) => {
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 10;
    return fetchFlowWorkItemAge(filters, Number.isFinite(limit) ? limit : 10);
  });
}
