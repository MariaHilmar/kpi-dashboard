import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { QualidadeResumo } from "@/components/dashboard/QualidadeResumo";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { BacklogAbertoPeriodoAviso } from "@/components/dashboard/BacklogAbertoPeriodoAviso";
import { AlertasPorModuloTabela } from "@/components/dashboard/tables/AlertasPorModuloTabela";
import { FaixaIdadeTabela } from "@/components/dashboard/tables/FaixaIdadeTabela";
import { TopLeadTimesTabela } from "@/components/dashboard/tables/TopLeadTimesTabela";
import { PageHeader } from "@/components/layout/PageHeader";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import {
  fetchAggregate,
  fetchAlertasResumo,
  fetchAlertasPorModulo,
  fetchFaixaIdade,
  fetchKpis,
  fetchQualidade,
  fetchTopLeadTimes,
} from "@/lib/dashboard/fetchers";
import { buildKpiIssuesHref } from "@/lib/dashboard/issuesLinks";
import { ALERTAS_SECTION_TOOLTIPS } from "@/lib/dashboard/alertas-section-tooltips";
import { QUALIDADE_SECTION_TOOLTIPS } from "@/lib/dashboard/qualidade-section-tooltips";
import { formatNumber, formatPercent } from "@/lib/format";

export default async function QualidadePage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const [qualidade, kpis, semTipoModulo, alertasResumo, semEpico, semParceria, faixaIdade, topLeadTimes] = await Promise.all([
    fetchQualidade(filters),
    fetchKpis(filters),
    fetchAggregate("modulo", filters, { limit: TOP_LIMIT.modulo, onlyAbertas: true }),
    fetchAlertasResumo(filters),
    fetchAlertasPorModulo("sem_epico", filters),
    fetchAlertasPorModulo("sem_parceria", filters),
    fetchFaixaIdade(filters),
    fetchTopLeadTimes(filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Qualidade dos Dados"
        subtitle="Conformidade de preenchimento (módulo, área, padrão de título) e itens sem tipo, parceria ou épico definido."
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.page}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">Alertas - dados não informados</h2>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <QualidadeResumo data={alertasResumo} filters={filters} />
          </div>

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
      </section>

      <BarChartCard
        title="Qualidade dos Dados"
        subtitle="Conformidade (respostas 'Sim')"
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.conformidade}
        data={qualidade}
      />

      <BacklogAbertoPeriodoAviso filters={filters} />

      <BarChartCard
        title="Backlog aberto por módulo"
        subtitle="Issues abertas por módulo (top 14)"
        titleTooltip={QUALIDADE_SECTION_TOOLTIPS.backlogAbertoModulo}
        data={semTipoModulo}
        horizontal
        issuesDrilldown={{ filters, dimension: "modulo", estado: "open" }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AlertasPorModuloTabela
          title="Issues abertas sem Épico — por Módulo"
          titleTooltip={ALERTAS_SECTION_TOOLTIPS.semEpicoPorModulo}
          dimensao="sem_epico"
          filters={filters}
          rows={semEpico}
        />
        <AlertasPorModuloTabela
          title="Issues abertas sem Parceria — por Módulo"
          titleTooltip={ALERTAS_SECTION_TOOLTIPS.semParceriaPorModulo}
          dimensao="sem_parceria"
          filters={filters}
          rows={semParceria}
        />
      </div>

      <FaixaIdadeTabela filters={filters} rows={faixaIdade} />

      <TopLeadTimesTabela rows={topLeadTimes} />
    </div>
  );
}
