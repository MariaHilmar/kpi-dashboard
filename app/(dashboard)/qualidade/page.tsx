import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { fetchAggregate, fetchKpis, fetchQualidade } from "@/lib/dashboard/fetchers";
import { buildKpiIssuesHref } from "@/lib/dashboard/issuesLinks";
import { QUALIDADE_SECTION_TOOLTIPS } from "@/lib/dashboard/qualidade-section-tooltips";
import { formatNumber, formatPercent } from "@/lib/format";

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
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.page}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Issues sem tipo definido"
          value={formatNumber(kpis?.sem_tipo ?? 0)}
          accent="warning"
          tooltip={QUALIDADE_SECTION_TOOLTIPS.issuesSemTipo}
          issuesHref={buildKpiIssuesHref(filters, "sem_tipo")}
          issueCount={kpis?.sem_tipo ?? 0}
        />
        <KpiCard
          label="% Bugs no backlog"
          value={formatPercent(kpis?.pct_bugs_backlog ?? 0)}
          accent="danger"
          tooltip={QUALIDADE_SECTION_TOOLTIPS.pctBugsBacklog}
        />
        <KpiCard
          label="SLA acima de 90d"
          value={formatNumber(kpis?.sla_acima_90 ?? 0)}
          accent="danger"
          tooltip={QUALIDADE_SECTION_TOOLTIPS.slaAcima90}
          issuesHref={buildKpiIssuesHref(filters, "sla_acima_90")}
          issueCount={kpis?.sla_acima_90 ?? 0}
        />
        <KpiCard
          label="Total filtrado"
          value={formatNumber(kpis?.total ?? 0)}
          tooltip={QUALIDADE_SECTION_TOOLTIPS.totalFiltrado}
          issuesHref={buildKpiIssuesHref(filters, "total")}
          issueCount={kpis?.total ?? 0}
        />
      </div>

      <BarChartCard
        title="Qualidade dos Dados"
        subtitle="Conformidade (respostas 'Sim')"
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.conformidade}
        data={qualidade}
      />

      <BarChartCard
        title="Backlog aberto por módulo"
        subtitle="Issues abertas por módulo (top 14)"
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.backlogAbertoModulo}
        data={semTipoModulo}
        horizontal
        issuesDrilldown={{ filters, dimension: "modulo", estado: "open" }}
      />
    </div>
  );
}
