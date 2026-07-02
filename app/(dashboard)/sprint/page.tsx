import { redirect } from "next/navigation";

import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TODOS, TOP_LIMIT } from "@/lib/dashboard/constants";
import { fetchAggregate, fetchFilterOptions, fetchKpis } from "@/lib/dashboard/fetchers";
import { resolveLatestSprint } from "@/lib/dashboard/filters";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";

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

  const [kpis, status, tipo, equipes] = await Promise.all([
    fetchKpis(filters),
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
  ]);

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

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutChartCard
          title="Status"
          subtitle="Distribuição no recorte"
          data={status}
          colorScheme="issue-status"
        />
        <DonutChartCard title="Tipo" subtitle="Distribuição no recorte" data={tipo} />
        <BarChartCard title="Equipes" subtitle="Volume por equipe" data={equipes} />
      </div>
    </div>
  );
}
