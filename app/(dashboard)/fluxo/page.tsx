import { Suspense } from "react";

import { FluxoApproximationNotice } from "@/components/dashboard/fluxo/FluxoApproximationNotice";
import { FluxoCfdSection } from "@/components/dashboard/fluxo/FluxoCfdSection";
import { FluxoDataQualityFooterSection } from "@/components/dashboard/fluxo/FluxoDataQualityFooterSection";
import { FluxoFilters } from "@/components/dashboard/fluxo/FluxoFilters";
import { FluxoResumoSection } from "@/components/dashboard/fluxo/FluxoResumoSection";
import { FluxoCfdSkeleton, FluxoResumoSkeleton } from "@/components/dashboard/fluxo/FluxoSkeletons";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  parseFlowGranularity,
  resolveFlowPageFilters,
  type FlowReportFilters,
} from "@/lib/dashboard/flow-report-params";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";

export default async function FluxoPage({ searchParams }: DashboardPageProps) {
  const { configured } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const rawParams = await searchParams;
  const filters = resolveFlowPageFilters(rawParams);
  const granularity = parseFlowGranularity(
    typeof rawParams.granularity === "string" ? rawParams.granularity : null,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fluxo Kanban"
        subtitle="Resumo executivo, CFD, throughput, lead time, WIP e gargalos — histórico de status GitLab."
      />

      <FluxoApproximationNotice />

      <FluxoFilters
        startDate={filters.startDate!}
        endDate={filters.endDate!}
        assignee={filters.assignee}
        granularity={granularity}
      />

      <Suspense fallback={<FluxoResumoSkeleton />}>
        <FluxoResumoSection filters={filters} granularity={granularity} />
      </Suspense>

      <Suspense fallback={<FluxoCfdSkeleton />}>
        <FluxoCfdSection filters={filters} />
      </Suspense>

      <Suspense fallback={null}>
        <FluxoDataQualityFooterSection filters={filters} />
      </Suspense>
    </div>
  );
}
