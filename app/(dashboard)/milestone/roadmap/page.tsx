import { Suspense } from "react";

import { MilestoneRoadmapSection } from "@/components/dashboard/milestone/MilestoneRoadmapSection";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { listMilestoneOptions } from "@/lib/dashboard/milestones";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { assertDashboardPageVisible } from "@/lib/dashboard/page-visibility";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function MilestoneSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
      <div className="h-72 rounded-lg bg-slate-100" />
    </div>
  );
}

export default async function MilestoneRoadmapPage({ searchParams }: DashboardPageProps) {
  assertDashboardPageVisible("/milestone/roadmap");

  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const { configured } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const rawParams = await searchParams;
  const milestones = await listMilestoneOptions(120);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roadmap executivo"
        subtitle="O que cada sprint entregou, agrupado por módulo ou épico — visão PMO com timeline horizontal e drill-down."
      />

      {milestones.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nenhuma milestone importada. Sincronize milestones do GitLab em Importar Dados.
        </div>
      ) : (
        <Suspense fallback={<MilestoneSectionSkeleton />}>
          <MilestoneRoadmapSection
            milestones={milestones}
            fromRaw={rawParams.from}
            toRaw={rawParams.to}
            groupByRaw={rawParams.roadmapGroup}
            metricRaw={rawParams.roadmapMetric}
            topNRaw={rawParams.roadmapTopN}
            labelRaw={rawParams.roadmapLabel}
          />
        </Suspense>
      )}
    </div>
  );
}
