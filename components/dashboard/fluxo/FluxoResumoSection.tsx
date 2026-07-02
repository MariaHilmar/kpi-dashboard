import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { FluxoAgingChartCard } from "@/components/dashboard/fluxo/FluxoAgingChartCard";
import { FluxoBottlenecksTabela } from "@/components/dashboard/fluxo/FluxoBottlenecksTabela";
import { FluxoLeadTimeDistribuicaoCard } from "@/components/dashboard/fluxo/FluxoLeadTimeDistribuicaoCard";
import { FluxoResumoExecutivo } from "@/components/dashboard/fluxo/FluxoResumoExecutivo";
import { FluxoStageDwellChartCard } from "@/components/dashboard/fluxo/FluxoStageDwellChartCard";
import { FluxoWorkItemAgeTabela } from "@/components/dashboard/fluxo/FluxoWorkItemAgeTabela";
import {
  LeadTimeChartCard,
  ThroughputChartCard,
} from "@/components/dashboard/fluxo/FlowMetricCharts";
import { TODOS } from "@/lib/dashboard/constants";
import {
  averageLeadTime,
  averagePeriodThroughput,
  buildKpiTrend,
  extractStageDwellMeta,
  leadTimeAggToChartPoints,
  pickPrimaryBottleneck,
  pickStageWithMaxMedianDwell,
  stageDwellToChartPoints,
  sumWip,
  sumWipFromCfd,
  summarizeLeadTimeDistribution,
  throughputToChartPoints,
  weightedMedianLeadTime,
  workItemAgeToChartPoints,
  type KpiTrend,
} from "@/lib/dashboard/flow-charts";
import type { FlowGranularity, FlowReportFilters } from "@/lib/dashboard/flow-report-params";
import { shiftFlowPeriod } from "@/lib/dashboard/flow-report-params";
import {
  fetchFlowBottlenecks,
  fetchFlowCfd,
  fetchFlowLeadTimeAggregation,
  fetchFlowLeadTimeDetail,
  fetchFlowStageDwell,
  fetchFlowThroughput,
  fetchFlowWip,
  fetchFlowWorkItemAge,
} from "@/lib/dashboard/flow-report";

type FluxoResumoSectionProps = {
  filters: FlowReportFilters;
  granularity: FlowGranularity;
};

export async function FluxoResumoSection({ filters, granularity }: Readonly<FluxoResumoSectionProps>) {
  const showComparisons = filters.assignee === TODOS;
  const previousFilters = showComparisons ? shiftFlowPeriod(filters) : null;

  const [wip, throughput, leadTimeAgg, leadTimeDetail, workItemAge, bottlenecks, stageDwell, previousPeriod] =
    await Promise.all([
      fetchFlowWip(filters),
      fetchFlowThroughput(filters, granularity),
      fetchFlowLeadTimeAggregation(filters, granularity),
      fetchFlowLeadTimeDetail(filters),
      fetchFlowWorkItemAge(filters, 10),
      fetchFlowBottlenecks(filters),
      fetchFlowStageDwell(filters),
      previousFilters
        ? Promise.all([
            fetchFlowThroughput(previousFilters, granularity),
            fetchFlowLeadTimeAggregation(previousFilters, granularity),
            fetchFlowCfd({
              ...previousFilters,
              startDate: previousFilters.endDate,
              endDate: previousFilters.endDate,
            }),
          ])
        : Promise.resolve(null),
    ]);

  const throughputChart = throughputToChartPoints(throughput);
  const leadTimeChart = leadTimeAggToChartPoints(leadTimeAgg);
  const leadTimeDistribution = summarizeLeadTimeDistribution(leadTimeDetail);
  const wipTotal = sumWip(wip);
  const leadTimeMedio = averageLeadTime(leadTimeAgg);
  const leadTimeMediana =
    leadTimeDistribution?.mediana ?? weightedMedianLeadTime(leadTimeAgg);
  const throughputTotal = throughput.reduce((sum, row) => sum + row.quantidade_concluida, 0);
  const throughputMedio = averagePeriodThroughput(throughput);
  const gargalo = pickPrimaryBottleneck(bottlenecks);
  const stageDwellMeta = extractStageDwellMeta(stageDwell);
  const stageDwellChart = stageDwellToChartPoints(stageDwell);
  const stageDwellDestaque = pickStageWithMaxMedianDwell(stageDwell);
  const issueCritica = workItemAge[0] ?? null;
  const agingChart = workItemAgeToChartPoints(workItemAge, leadTimeMediana);

  let concluidasTrend: KpiTrend | undefined;
  let leadTimeMedianaTrend: KpiTrend | undefined;
  let wipTrend: KpiTrend | undefined;

  if (previousPeriod) {
    const [prevThroughput, prevLeadTimeAgg, prevCfd] = previousPeriod;
    const prevConcluidas = prevThroughput.reduce(
      (sum, row) => sum + row.quantidade_concluida,
      0,
    );
    const prevLeadTimeMediana = weightedMedianLeadTime(prevLeadTimeAgg);
    const prevWipTotal = sumWipFromCfd(prevCfd, previousFilters!.endDate!);

    concluidasTrend =
      buildKpiTrend(throughputTotal, prevConcluidas, {
        hasBaseline: prevConcluidas > 0,
      }) ?? undefined;

    leadTimeMedianaTrend =
      leadTimeMediana != null
        ? (buildKpiTrend(leadTimeMediana, prevLeadTimeMediana, {
            lowerIsBetter: true,
            hasBaseline: prevLeadTimeMediana != null && prevConcluidas > 0,
          }) ?? undefined)
        : undefined;

    wipTrend =
      buildKpiTrend(wipTotal, prevWipTotal, {
        lowerIsBetter: true,
        hasBaseline: prevCfd.length > 0,
      }) ?? undefined;
  }

  const wipChart = wip.map((row) => ({ label: row.etapa, quantidade: row.quantidade }));

  return (
    <>
      <FluxoResumoExecutivo
        concluidas={throughputTotal}
        leadTimeMedio={leadTimeMedio}
        leadTimeMediana={leadTimeMediana}
        wipTotal={wipTotal}
        throughputMedio={throughputMedio}
        throughputLabel={granularity === "month" ? "mensal" : "semanal"}
        gargalo={gargalo}
        issueCritica={issueCritica}
        concluidasTrend={concluidasTrend}
        leadTimeMedianaTrend={leadTimeMedianaTrend}
        wipTrend={wipTrend}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ThroughputChartCard
          title="Throughput"
          subtitle={`Issues concluídas por ${granularity === "month" ? "mês" : "semana"}`}
          data={throughputChart}
        />
        <div className="flex flex-col gap-6">
          <LeadTimeChartCard
            title="Lead time"
            subtitle="Média, mediana e percentil 85 por período de conclusão"
            data={leadTimeChart}
          />
          <FluxoLeadTimeDistribuicaoCard summary={leadTimeDistribution} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="WIP por etapa"
          subtitle="A Fazer, Desenvolvimento, Teste e Homologação"
          data={wipChart}
          horizontal
          emptyMessage="Nenhuma issue em WIP no recorte."
        />
        <FluxoBottlenecksTabela rows={bottlenecks} highlightEtapa={gargalo?.etapa ?? null} />
      </div>

      <FluxoStageDwellChartCard
        data={stageDwellChart}
        meta={stageDwellMeta}
        highlightEtapa={stageDwellDestaque?.etapa ?? null}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <FluxoAgingChartCard
          title="Aging chart — Top 10"
          subtitle="Tempo no fluxo ativo (A Fazer / Desenvolvimento em diante)"
          data={agingChart}
          leadTimeReferencia={leadTimeMediana}
        />
        <FluxoWorkItemAgeTabela rows={workItemAge} />
      </div>
    </>
  );
}
