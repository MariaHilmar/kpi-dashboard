import { BarChartCard } from "@/components/dashboard/BarChartCard";
import { DonutChartCard } from "@/components/dashboard/DonutChartCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MilestoneMixBarChartCard } from "@/components/dashboard/milestone/MilestoneMixBarChartCard";
import { TOP_LIMIT } from "@/lib/dashboard/constants";
import {
  formatMilestoneWipRefLabel,
  milestoneMixToChartPoints,
  milestoneMixToComparisonBars,
  milestoneWipToChartPoints,
  sumMilestoneWip,
  sumMilestoneWipStoryPoints,
} from "@/lib/dashboard/milestone-aggregates";
import {
  buildMilestoneFluxoHref,
  fetchMilestoneMix,
  fetchMilestoneSummary,
  fetchMilestoneWip,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";

type MilestoneWipMixSectionProps = {
  milestone: MilestoneDetail;
};

export async function MilestoneWipMixSection({
  milestone,
}: Readonly<MilestoneWipMixSectionProps>) {
  const [summary, wip, mixTipo, mixStatus, mixEquipe] = await Promise.all([
    fetchMilestoneSummary(milestone.gitlab_milestone_iid),
    fetchMilestoneWip(milestone.gitlab_milestone_iid),
    fetchMilestoneMix(milestone.gitlab_milestone_iid, "tipo"),
    fetchMilestoneMix(milestone.gitlab_milestone_iid, "status"),
    fetchMilestoneMix(milestone.gitlab_milestone_iid, "equipe", TOP_LIMIT.equipe),
  ]);

  const refDate = summary?.ref_date ?? wip[0]?.ref_date ?? null;
  const wipChart = milestoneWipToChartPoints(wip);
  const wipTotal = summary?.wip_issues ?? sumMilestoneWip(wip);
  const wipPoints = summary?.wip_story_points ?? sumMilestoneWipStoryPoints(wip);
  const hasStoryPoints =
    (summary?.committed_story_points ?? 0) > 0 || (summary?.wip_story_points ?? 0) > 0;

  const tipoComprometido = milestoneMixToChartPoints(mixTipo, "comprometido", "tipo");
  const tipoEntregue = milestoneMixToChartPoints(mixTipo, "entregue", "tipo");
  const statusComprometido = milestoneMixToChartPoints(mixStatus, "comprometido", "status");
  const statusEntregue = milestoneMixToChartPoints(mixStatus, "entregue", "status");
  const equipeComparison = milestoneMixToComparisonBars(mixEquipe);

  const fluxoHref =
    milestone.start_date && milestone.due_date
      ? buildMilestoneFluxoHref(milestone.start_date, milestone.due_date)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          {formatMilestoneWipRefLabel(refDate, milestone.due_date)} — etapas Kanban via{" "}
          <code className="text-xs">flow_map_etapa</code> (mesmo motor de /fluxo).
        </p>
        {fluxoHref ? (
          <p className="mt-1">
            CFD e gargalos completos:{" "}
            <a href={fluxoHref} className="font-medium text-blue-700 hover:underline">
              abrir /fluxo
            </a>{" "}
            com a janela da sprint.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="WIP no fechamento"
          value={String(wipTotal)}
          hint="Issues abertas nas etapas A Fazer → Homologação"
        />
        {hasStoryPoints ? (
          <KpiCard
            label="Story points WIP"
            value={String(wipPoints)}
            hint="Soma de story_points nas issues em WIP"
          />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title="WIP por etapa"
          subtitle={formatMilestoneWipRefLabel(refDate, milestone.due_date)}
          titleTooltip="Issues abertas da milestone nas etapas WIP (A Fazer, Desenvolvimento, Teste, Homologação). Usa flow_resolve_etapa_on_date com fallback de snapshot."
          data={wipChart}
          horizontal
          emptyMessage="Nenhuma issue em WIP no snapshot."
        />
        <MilestoneMixBarChartCard
          title="Equipes — comprometido × entregue"
          subtitle="Top equipes do recorte milestone"
          titleTooltip="Comprometido = milestone_issues no import. Entregue = fechado_em dentro da janela da sprint."
          data={equipeComparison}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DonutChartCard
          title="Tipo — comprometido"
          subtitle="Mix planejado no import"
          data={tipoComprometido}
        />
        <DonutChartCard
          title="Tipo — entregue"
          subtitle="Mix fechado no intervalo da sprint"
          data={tipoEntregue}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DonutChartCard
          title="Status — comprometido"
          subtitle="Distribuição no snapshot"
          data={statusComprometido}
          colorScheme="issue-status"
        />
        <DonutChartCard
          title="Status — entregue"
          subtitle="Distribuição das entregas"
          data={statusEntregue}
          colorScheme="issue-status"
        />
      </div>
    </div>
  );
}
