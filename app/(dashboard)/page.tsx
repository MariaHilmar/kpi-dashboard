import { Suspense } from "react";

import { DetalhamentoSection } from "@/components/dashboard/executivo/DetalhamentoSection";
import { DistribuicaoSection } from "@/components/dashboard/executivo/DistribuicaoSection";
import { MergeadasPivotSection } from "@/components/dashboard/executivo/MergeadasPivotSection";
import {
  ChartCardSkeleton,
  FluxoMensalSkeleton,
  KpiGridSkeleton,
} from "@/components/dashboard/executivo/ExecutivoSkeletons";
import { FluxoMensalSection } from "@/components/dashboard/executivo/FluxoMensalSection";
import { KpiSection } from "@/components/dashboard/executivo/KpiSection";
import { ExecutivoExportBar } from "@/components/dashboard/executivo/ExecutivoExportBar";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";

export default async function ExecutivoPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return (
      <SetupBanner message="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local" />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Dashboard Executivo"
          subtitle="Visão consolidada de KPIs, evolução mensal, distribuição e detalhamento."
          titleTooltip={EXECUTIVO_SECTION_TOOLTIPS.page}
        />
        <ExecutivoExportBar filters={filters} />
      </div>

      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiSection filters={filters} />
      </Suspense>

      <Suspense fallback={<FluxoMensalSkeleton />}>
        <FluxoMensalSection filters={filters} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-6 xl:grid-cols-3">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        }
      >
        <DistribuicaoSection filters={filters} />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        }
      >
        <DetalhamentoSection filters={filters} />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <ChartCardSkeleton className="h-48" />
            <div className="grid gap-6 xl:grid-cols-3">
              <ChartCardSkeleton />
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </div>
          </div>
        }
      >
        <MergeadasPivotSection filters={filters} />
      </Suspense>
    </div>
  );
}
