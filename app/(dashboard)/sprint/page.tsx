import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TODOS, TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate, fetchKpis } from "@/lib/dashboard/fetchers";

export const dynamic = "force-dynamic";

export default async function SprintPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [kpis, status, tipo, equipes] = await Promise.all([
    fetchKpis(filters),
    fetchAggregate("status", filters),
    fetchAggregate("tipo", filters),
    fetchAggregate("equipe", filters, { limit: TOP_LIMIT.equipe }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sprint"
        subtitle="Use o filtro global de Sprint para focar no ciclo atual. KPIs e distribuição respeitam o filtro selecionado."
      />

      {filters.sprint === TODOS ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Selecione uma <strong>Sprint</strong> nos filtros globais para focar a análise em um ciclo específico.
        </div>
      ) : null}

      <KpiGrid kpis={kpis} />

      <div className="grid gap-6 xl:grid-cols-3">
        <DonutChartCard title="Status" subtitle="Distribuição no recorte" data={status} />
        <DonutChartCard title="Tipo" subtitle="Distribuição no recorte" data={tipo} />
        <BarChartCard title="Equipes" subtitle="Volume por equipe" data={equipes} />
      </div>
    </div>
  );
}
