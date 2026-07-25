import { Suspense } from "react";
import { redirect } from "next/navigation";

import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { MilestoneTendenciasSection } from "@/components/dashboard/milestone/MilestoneTendenciasSection";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { SprintStoryPointsStrip } from "@/components/sprint/SprintStoryPointsStrip";
import { TODOS, TOP_LIMIT } from "@/lib/dashboard/constants";
import { fetchAggregate, fetchFilterOptions, fetchKpis } from "@/lib/dashboard/fetchers";
import { resolveLatestSprint } from "@/lib/dashboard/filters";
import {
  resolveLatestMilestoneIid,
  resolveMilestoneIidForSprintFilter,
} from "@/lib/dashboard/milestone-options";
import { listMilestoneOptions } from "@/lib/dashboard/milestones";
import { fetchStoryPointsKpis } from "@/lib/dashboard/story-points-kpis";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { assertDashboardPageVisible } from "@/lib/dashboard/page-visibility";

function MilestoneSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
      <div className="h-72 rounded-lg bg-slate-100" />
    </div>
  );
}

function buildSprintSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  sprint: string,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "sprint" || typeof value !== "string" || value === "") continue;
    params.set(key, value);
  }
  params.set("sprint", sprint);
  return params.toString();
}

export default async function SprintPage({ searchParams }: DashboardPageProps) {
  assertDashboardPageVisible("/sprint");

  const rawParams = await searchParams;

  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  if (!("sprint" in rawParams)) {
    const { sprints } = await fetchFilterOptions();
    const latestSprint = resolveLatestSprint(sprints);
    if (latestSprint) {
      redirect(`/sprint?${buildSprintSearchParams(rawParams, latestSprint)}`);
    }
  }

  const [kpis, storyPointsKpis, status, tipo, equipes, milestones] = await Promise.all([
    fetchKpis(filters),
    fetchStoryPointsKpis(filters),
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
    listMilestoneOptions(),
  ]);

  const anchorIid =
    filters.sprint !== TODOS
      ? resolveMilestoneIidForSprintFilter(filters.sprint, milestones)
      : resolveLatestMilestoneIid(milestones);

  const pageTitle =
    filters.sprint === TODOS ? "Sprint = Todos" : `Sprint — ${filters.sprint}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={pageTitle}
        subtitle="Ao entrar na página, a sprint mais recente é selecionada. Você pode alterar o filtro enquanto permanece aqui."
      />

      {filters.sprint === TODOS ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Nenhuma sprint específica selecionada. Escolha uma sprint nos filtros globais ou recarregue a
          página para voltar ao padrão (sprint mais recente).
        </div>
      ) : null}

      <KpiGrid kpis={kpis} />

      <SprintStoryPointsStrip kpis={storyPointsKpis} />

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutChartCard
          title="Status"
          subtitle="Distribuição no recorte"
          data={status}
          colorScheme="issue-status"
          issuesDrilldown={{ filters, dimension: "status" }}
        />
        <DonutChartCard
          title="Tipo"
          subtitle="Distribuição no recorte"
          data={tipo}
          issuesDrilldown={{ filters, dimension: "tipo" }}
        />
        <BarChartCard
          title="Equipes"
          subtitle="Volume por equipe"
          data={equipes}
          issuesDrilldown={{ filters, dimension: "equipe" }}
        />
      </div>

      {milestones.length > 0 ? (
        <Suspense fallback={<MilestoneSectionSkeleton />}>
          <MilestoneTendenciasSection
            milestones={milestones}
            anchorIid={anchorIid}
            fromRaw={rawParams.from}
            toRaw={rawParams.to}
            metricRaw={rawParams.capacityMetric}
            teamRaw={rawParams.capacityTeam}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Importe milestones do GitLab em Importar Dados para ver tendências entre sprints.
        </div>
      )}
    </div>
  );
}
