import { CfdChartCard } from "@/components/dashboard/fluxo/CfdChartCard";
import { pivotCfdRows } from "@/lib/dashboard/flow-charts";
import type { FlowReportFilters } from "@/lib/dashboard/flow-report-params";
import { fetchFlowCfd } from "@/lib/dashboard/flow-report";
import { formatDate } from "@/lib/format";

type FluxoCfdSectionProps = {
  filters: FlowReportFilters;
};

export async function FluxoCfdSection({ filters }: FluxoCfdSectionProps) {
  const cfd = await fetchFlowCfd(filters);
  const cfdChart = pivotCfdRows(cfd);

  return (
    <CfdChartCard
      title="Diagrama de Fluxo Cumulativo (CFD)"
      subtitle={`${formatDate(filters.startDate)} — ${formatDate(filters.endDate)}`}
      data={cfdChart}
    />
  );
}
