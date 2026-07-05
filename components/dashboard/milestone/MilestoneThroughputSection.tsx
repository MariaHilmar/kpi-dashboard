import { MilestoneThroughputChartCard } from "@/components/dashboard/milestone/MilestoneThroughputChartCard";
import {
  averagePeriodThroughput,
  formatFlowWeekPeriodLabel,
  throughputToChartPoints,
} from "@/lib/dashboard/flow-charts";
import type { FlowGranularity } from "@/lib/dashboard/flow-report-params";
import {
  buildMilestoneFluxoHref,
  fetchMilestoneThroughput,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";

type MilestoneThroughputSectionProps = {
  milestone: MilestoneDetail;
  granularity: FlowGranularity;
};

function milestoneThroughputToChartPoints(
  rows: Awaited<ReturnType<typeof fetchMilestoneThroughput>>,
) {
  return rows.map((row) => ({
    periodo: formatFlowWeekPeriodLabel(row.periodo),
    concluidas: row.quantidade_concluida,
    storyPoints: row.story_points,
  }));
}

function formatMilestoneDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Datas não definidas";
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? "—";
}

export async function MilestoneThroughputSection({
  milestone,
  granularity,
}: Readonly<MilestoneThroughputSectionProps>) {
  const throughput = await fetchMilestoneThroughput(milestone.gitlab_milestone_iid, granularity);
  const chartData = milestoneThroughputToChartPoints(throughput);
  const flowChartData = throughputToChartPoints(
    throughput.map((row) => ({
      periodo: row.periodo,
      quantidade_concluida: row.quantidade_concluida,
    })),
  );
  const throughputMedio = averagePeriodThroughput(
    throughput.map((row) => ({
      periodo: row.periodo,
      quantidade_concluida: row.quantidade_concluida,
    })),
  );
  const hasStoryPoints = throughput.some((row) => row.story_points > 0);
  const fluxoHref =
    milestone.start_date && milestone.due_date
      ? buildMilestoneFluxoHref(milestone.start_date, milestone.due_date, granularity)
      : null;

  const periodLabel = granularity === "month" ? "mês" : "semana";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          Janela da sprint:{" "}
          <strong>{formatMilestoneDateRange(milestone.start_date, milestone.due_date)}</strong>
        </p>
        {throughputMedio != null ? (
          <p className="mt-1 text-slate-600">
            Throughput médio ({periodLabel}):{" "}
            <strong>{throughputMedio.toFixed(1)}</strong> issues
          </p>
        ) : null}
      </div>

      <MilestoneThroughputChartCard
        title="Throughput intra-sprint"
        subtitle={`Issues concluídas por ${periodLabel} — mesmo motor de /fluxo, recorte automático pela milestone`}
        titleTooltip={
          "Delega a report_flow_throughput com start_date e due_date da milestone. Story points vêm do snapshot milestone_issues (Planning Poker)."
        }
        data={chartData}
        fluxoHref={fluxoHref}
        showStoryPoints={hasStoryPoints}
      />

      {flowChartData.length > 0 ? (
        <p className="text-xs text-slate-500">
          Os números de issues concluídas devem coincidir com /fluxo usando manualmente as mesmas
          datas ({milestone.start_date} a {milestone.due_date}).
        </p>
      ) : null}
    </div>
  );
}
