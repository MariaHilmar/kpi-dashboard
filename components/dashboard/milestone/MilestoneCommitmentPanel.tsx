"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  buildMilestoneNotDeliveredHref,
  formatMilestoneCommitmentWindow,
  milestoneCommitmentDeliveryRate,
  type MilestoneCommitment,
  type MilestoneCommitmentComparisonBar,
} from "@/lib/dashboard/milestone-commitment";
import { EMPTY_PLACEHOLDER, formatNumber, formatPercent } from "@/lib/format";

type MilestoneCommitmentPanelProps = {
  milestoneIid: number;
  commitment: MilestoneCommitment;
  comparisonBars: MilestoneCommitmentComparisonBar[];
};

function deliveryRateLabel(delivered: number, committed: number): string {
  const rate = milestoneCommitmentDeliveryRate(delivered, committed);
  return rate == null ? EMPTY_PLACEHOLDER : formatPercent(rate);
}

export function MilestoneCommitmentPanel({
  milestoneIid,
  commitment,
  comparisonBars,
}: Readonly<MilestoneCommitmentPanelProps>) {
  const notDeliveredHref = buildMilestoneNotDeliveredHref(milestoneIid);
  const windowLabel = formatMilestoneCommitmentWindow(
    commitment.start_date,
    commitment.due_date,
  );
  const chartData = comparisonBars.filter(
    (row) => row.comprometido > 0 || row.entregue > 0,
  );

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Comprometido vs entregue"
        subtitle={windowLabel}
        tooltip="Comprometido = count/soma em milestone_issues no import. Entregue = fechado_em::date dentro de start_date–due_date. Issues sem fechado_em contam como não entregues."
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          Comparação planejado × fechado no intervalo da sprint. Datas de milestone são{" "}
          <code className="text-xs">date</code>; <code className="text-xs">fechado_em</code> é
          convertido para data em UTC antes da comparação (
          <a href="#milestone-timezone" className="font-medium text-blue-700 hover:underline">
            regra de timezone
          </a>
          ).
        </p>
        {commitment.missing_close_date_issues > 0 ? (
          <p className="mt-1 text-amber-800">
            {formatNumber(commitment.missing_close_date_issues)} issue(s) podem estar fechadas no
            GitLab sem <code className="text-xs">fechado_em</code> sincronizado — conferir amostra
            manual.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Comprometido (issues)"
          value={formatNumber(commitment.committed_issues)}
          hint="Issues no snapshot milestone_issues"
        />
        <KpiCard
          label="Entregue (issues)"
          value={formatNumber(commitment.delivered_issues)}
          hint={`Fechadas entre ${windowLabel}`}
        />
        <KpiCard
          label="Taxa de entrega"
          value={deliveryRateLabel(
            commitment.delivered_issues,
            commitment.committed_issues,
          )}
          hint="Entregue ÷ comprometido"
        />
        <KpiCard
          label="Não entregues"
          value={formatNumber(commitment.not_delivered_issues)}
          issuesHref={notDeliveredHref}
          issueCount={commitment.not_delivered_issues}
          hint="Carry implícito — abertas ou fechadas fora da janela"
        />
      </div>

      {commitment.has_story_points ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            label="Pontos comprometidos"
            value={formatNumber(commitment.committed_story_points)}
            hint="Soma story_points no import"
          />
          <KpiCard
            label="Pontos entregues"
            value={formatNumber(commitment.delivered_story_points)}
            hint={`Taxa: ${deliveryRateLabel(
              commitment.delivered_story_points,
              commitment.committed_story_points,
            )} — de ${formatNumber(commitment.committed_story_points)} comprometidos`}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Story points: <strong>N/A</strong> — nenhum peso Planning Poker no snapshot desta sprint.
          Métricas exibidas apenas por contagem de issues.
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Comparativo comprometido × entregue
        </h3>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
            Nenhum dado comprometido para esta sprint.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="comprometido"
                  name="Comprometido"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="entregue"
                  name="Entregue"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div id="milestone-timezone" className="text-xs text-slate-500">
        <strong className="text-slate-700">Timezone:</strong>{" "}
        <code>fechado_em</code> (timestamptz) → <code>fechado_em::date</code> em UTC (sessão
        Supabase). <code>start_date</code>/<code>due_date</code> são <code>date</code> do GitLab.
        Fechamentos após 21h BRT podem cair no dia UTC seguinte — validar Sprint 90 manualmente
        (± issues sem <code>fechado_em</code>).
      </div>
    </section>
  );
}
