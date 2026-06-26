import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate, fetchKpis, fetchQualidade } from "@/lib/dashboard/fetchers";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QualidadePage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [qualidade, kpis, semTipoModulo] = await Promise.all([
    fetchQualidade(filters),
    fetchKpis(filters),
    fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo, onlyAbertas: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Qualidade dos Dados"
        subtitle="Conformidade de preenchimento (módulo, área, padrão de título) e itens sem tipo."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Sem tipo" value={formatNumber(kpis?.sem_tipo ?? 0)} accent="warning" />
        <KpiCard
          label="% Bugs no backlog"
          value={formatPercent(kpis?.pct_bugs_backlog ?? 0)}
          accent="danger"
        />
        <KpiCard label="SLA acima de 90d" value={formatNumber(kpis?.sla_acima_90 ?? 0)} accent="danger" />
        <KpiCard label="Total filtrado" value={formatNumber(kpis?.total ?? 0)} />
      </div>

      <BarChartCard
        title="Qualidade dos Dados"
        subtitle="Conformidade (respostas 'Sim')"
        data={qualidade}
      />

      <BarChartCard
        title="Backlog aberto por módulo"
        subtitle="Issues abertas por módulo (top 14)"
        data={semTipoModulo}
        horizontal
      />
    </div>
  );
}
