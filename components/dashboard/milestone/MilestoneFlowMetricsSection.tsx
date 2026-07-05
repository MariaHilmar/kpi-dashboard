import { FluxoLeadTimeDistribuicaoCard } from "@/components/dashboard/fluxo/FluxoLeadTimeDistribuicaoCard";
import { FluxoStageDwellChartCard } from "@/components/dashboard/fluxo/FluxoStageDwellChartCard";
import { LinkButton } from "@/components/ui/Button";
import {
  extractStageDwellMeta,
  pickStageWithMaxMedianDwell,
  stageDwellToChartPoints,
  summarizeLeadTimeDistribution,
} from "@/lib/dashboard/flow-charts";
import type { FlowGranularity } from "@/lib/dashboard/flow-report-params";
import {
  buildMilestoneFluxoHref,
  fetchMilestoneLeadTimeDetail,
  fetchMilestoneStageDwell,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";
import { formatDecimal } from "@/lib/format";

type MilestoneFlowMetricsSectionProps = {
  milestone: MilestoneDetail;
  granularity: FlowGranularity;
};

function formatMilestoneDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Datas não definidas";
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? "—";
}

export async function MilestoneFlowMetricsSection({
  milestone,
  granularity,
}: Readonly<MilestoneFlowMetricsSectionProps>) {
  const [stageDwell, leadTimeDetail] = await Promise.all([
    fetchMilestoneStageDwell(milestone.gitlab_milestone_iid),
    fetchMilestoneLeadTimeDetail(milestone.gitlab_milestone_iid),
  ]);

  const stageDwellMeta = extractStageDwellMeta(stageDwell);
  const stageDwellChart = stageDwellToChartPoints(stageDwell);
  const stageDwellDestaque = pickStageWithMaxMedianDwell(stageDwell);
  const leadTimeDistribution = summarizeLeadTimeDistribution(leadTimeDetail);
  const leadTimeMediana = leadTimeDistribution?.mediana ?? null;

  const fluxoHref =
    milestone.start_date && milestone.due_date
      ? buildMilestoneFluxoHref(milestone.start_date, milestone.due_date, granularity)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div>
          <p>
            Lead time e dwell — issues entregues na sprint:{" "}
            <strong>{formatMilestoneDateRange(milestone.start_date, milestone.due_date)}</strong>
          </p>
          {leadTimeMediana != null ? (
            <p className="mt-1 text-slate-600">
              Mediana de lead time: <strong>{formatDecimal(leadTimeMediana)} dias</strong>
              {stageDwellDestaque?.etapa ? (
                <>
                  {" "}
                  · maior retenção: <strong>{stageDwellDestaque.etapa}</strong>
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-1 text-slate-600">Nenhuma issue entregue no intervalo da sprint.</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Mesmo motor de /fluxo com recorte por milestone_issues; mediana preferida sobre média.
          </p>
        </div>
        {fluxoHref ? (
          <LinkButton href={fluxoHref} variant="outline" size="sm">
            Ver no Fluxo
          </LinkButton>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FluxoLeadTimeDistribuicaoCard summary={leadTimeDistribution} />
        <FluxoStageDwellChartCard
          data={stageDwellChart}
          meta={stageDwellMeta}
          highlightEtapa={stageDwellDestaque?.etapa ?? null}
        />
      </div>

      {fluxoHref && leadTimeDistribution && leadTimeDistribution.count > 0 ? (
        <p className="text-xs text-slate-500">
          Mediana e dwell devem coincidir com /fluxo usando as mesmas datas (
          {milestone.start_date} a {milestone.due_date}). O recorte da milestone limita às issues
          do snapshot da sprint; /fluxo por datas inclui todas as conclusões no intervalo.
        </p>
      ) : null}
    </div>
  );
}
