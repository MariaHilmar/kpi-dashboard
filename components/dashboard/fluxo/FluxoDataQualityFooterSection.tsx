import { FluxoDataQualityFooter } from "@/components/dashboard/fluxo/FluxoDataQualityFooter";
import { summarizeFlowDataQuality } from "@/lib/dashboard/flow-charts";
import type { FlowReportFilters } from "@/lib/dashboard/flow-report-params";
import { fetchFlowDataQuality } from "@/lib/dashboard/flow-report";

type FluxoDataQualityFooterSectionProps = {
  filters: FlowReportFilters;
};

export async function FluxoDataQualityFooterSection({
  filters,
}: FluxoDataQualityFooterSectionProps) {
  const row = await fetchFlowDataQuality(filters);
  const summary = summarizeFlowDataQuality(row);

  return <FluxoDataQualityFooter summary={summary} />;
}
