import {
  fetchFlowThroughput,
  flowReportRoute,
  parseFlowGranularity,
} from "@/lib/dashboard/flow-report-api";

export async function GET(request: Request) {
  return flowReportRoute(request, (filters, url) => {
    const granularity = parseFlowGranularity(url.searchParams.get("granularity"));
    return fetchFlowThroughput(filters, granularity);
  });
}
