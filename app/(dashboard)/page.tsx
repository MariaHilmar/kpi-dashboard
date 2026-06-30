import { Suspense } from "react";

import { DistribuicaoSection } from "@/components/dashboard/executivo/DistribuicaoSection";
import {
  ChartCardSkeleton,
  FluxoMensalSkeleton,
  KpiGridSkeleton,
} from "@/components/dashboard/executivo/ExecutivoSkeletons";
import { FluxoMensalSection } from "@/components/dashboard/executivo/FluxoMensalSection";
import { KpiSection } from "@/components/dashboard/executivo/KpiSection";
import { VolumeSection } from "@/components/dashboard/executivo/VolumeSection";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão consolidada de KPIs, evolução mensal e distribuição por status, tipo e prioridade."
      />

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
          </div>
        }
      >
        <VolumeSection filters={filters} />
      </Suspense>
    </div>
  );
}
