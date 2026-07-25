import { Suspense } from "react";
import { redirect } from "next/navigation";

import { MilestoneBurndownSection } from "@/components/dashboard/milestone/MilestoneBurndownSection";
import { MilestoneCommitmentSection } from "@/components/dashboard/milestone/MilestoneCommitmentSection";
import { MilestoneDeliveryByDimensionSection } from "@/components/dashboard/milestone/MilestoneDeliveryByDimensionSection";
import { MilestoneEmptyState } from "@/components/dashboard/milestone/MilestoneEmptyState";
import { MilestoneFlowMetricsSection } from "@/components/dashboard/milestone/MilestoneFlowMetricsSection";
import { MilestoneIssuesSection } from "@/components/dashboard/milestone/MilestoneIssuesSection";
import { MilestoneSelector } from "@/components/dashboard/milestone/MilestoneSelector";
import { MilestoneThroughputSection } from "@/components/dashboard/milestone/MilestoneThroughputSection";
import { MilestoneTendenciasSection } from "@/components/dashboard/milestone/MilestoneTendenciasSection";
import { MilestoneWipMixSection } from "@/components/dashboard/milestone/MilestoneWipMixSection";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { parseFlowGranularity } from "@/lib/dashboard/flow-report-params";
import { parseMilestoneIssuesListParams, recordFromSearchParams } from "@/lib/dashboard/milestone-issues-params";
import { fetchMilestoneDetail } from "@/lib/dashboard/milestone-report";
import { milestoneIidsDesc, resolveLatestMilestoneIid } from "@/lib/dashboard/milestone-options";
import { listMilestoneOptions } from "@/lib/dashboard/milestones";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { assertDashboardPageVisible } from "@/lib/dashboard/page-visibility";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function parseMilestoneIid(raw: string | string[] | undefined): number | null {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
  if (!value) return null;
  const iid = Number(value);
  return Number.isInteger(iid) && iid > 0 ? iid : null;
}

function buildMilestoneSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  milestoneIid: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "iid" || typeof value !== "string" || value === "") continue;
    params.set(key, value);
  }
  params.set("iid", String(milestoneIid));
  return params.toString();
}

function MilestoneSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
      <div className="h-72 rounded-lg bg-slate-100" />
    </div>
  );
}

export default async function MilestonePage({ searchParams }: DashboardPageProps) {
  assertDashboardPageVisible("/milestone");

  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const { configured } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const rawParams = await searchParams;
  const milestones = await listMilestoneOptions();
  const availableIids = milestoneIidsDesc(milestones);

  if (!("iid" in rawParams)) {
    const latestIid = resolveLatestMilestoneIid(milestones);
    if (latestIid != null) {
      redirect(`/milestone?${buildMilestoneSearchParams(rawParams, latestIid)}`);
    }
  }

  const milestoneIid = parseMilestoneIid(rawParams.iid);

  const granularity = parseFlowGranularity(
    typeof rawParams.granularity === "string" ? rawParams.granularity : null,
  );

  const issuesListParams = parseMilestoneIssuesListParams(recordFromSearchParams(rawParams));

  const milestone = milestoneIid != null ? await fetchMilestoneDetail(milestoneIid) : null;

  const pageTitle =
    milestone != null
      ? `Sprint ${milestone.gitlab_milestone_iid} — ${milestone.titulo}`
      : "Relatório Milestone";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={pageTitle}
        subtitle="Ao entrar, a sprint mais recente é selecionada. Você pode trocar a milestone no seletor abaixo — WIP, mix, throughput, lead time e dwell no recorte da sprint."
      />

      <MilestoneSelector milestones={milestones} selectedIid={milestoneIid} />

      {milestoneIid == null ? (
        <MilestoneEmptyState type="no-milestone" />
      ) : milestone == null ? (
        <MilestoneEmptyState type="not-found" milestoneIid={milestoneIid} />
      ) : (
        <>
          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneCommitmentSection milestone={milestone} />
          </Suspense>

          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneWipMixSection milestone={milestone} />
          </Suspense>

          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneBurndownSection
              milestone={milestone}
              availableIids={availableIids}
              burndownMetric={rawParams.burndownMetric}
              burndownGranularity={rawParams.burndownGranularity}
            />
          </Suspense>

          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneIssuesSection milestone={milestone} listParams={issuesListParams} />
          </Suspense>

          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneDeliveryByDimensionSection
              milestone={milestone}
              deliveryDim={rawParams.deliveryDim}
              deliveryLimit={rawParams.deliveryLimit}
              deliveryOrder={rawParams.deliveryOrder}
            />
          </Suspense>

          {!milestone.start_date || !milestone.due_date ? (
            <MilestoneEmptyState type="missing-dates" />
          ) : (
            <>
              <Suspense fallback={<MilestoneSectionSkeleton />}>
                <MilestoneThroughputSection milestone={milestone} granularity={granularity} />
              </Suspense>

              <Suspense fallback={<MilestoneSectionSkeleton />}>
                <MilestoneFlowMetricsSection milestone={milestone} granularity={granularity} />
              </Suspense>
            </>
          )}

          <Suspense fallback={<MilestoneSectionSkeleton />}>
            <MilestoneTendenciasSection
              milestones={milestones}
              anchorIid={milestone.gitlab_milestone_iid}
              fromRaw={rawParams.from}
              toRaw={rawParams.to}
              metricRaw={rawParams.capacityMetric}
              teamRaw={rawParams.capacityTeam}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
