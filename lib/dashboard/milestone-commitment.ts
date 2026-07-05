/**
 * KPI Comprometido vs Entregue — issue #32.
 *
 * Timezone: `fechado_em` é timestamptz; comparação de entrega usa `fechado_em::date`
 * contra `milestones.start_date` / `due_date` (date) no fuso da sessão Postgres (UTC no Supabase).
 * Ver docs/13-relatorio-milestone.md#timezone-e-datas-de-entrega.
 */

export type MilestoneCommitment = {
  start_date: string | null;
  due_date: string | null;
  committed_issues: number;
  committed_story_points: number;
  delivered_issues: number;
  delivered_story_points: number;
  not_delivered_issues: number;
  not_delivered_story_points: number;
  has_story_points: boolean;
  missing_close_date_issues: number;
};

export type MilestoneCommitmentComparisonBar = {
  label: string;
  comprometido: number;
  entregue: number;
};

/** Taxa entregue ÷ comprometido × 100; null quando denominador = 0. */
export function milestoneCommitmentDeliveryRate(
  delivered: number,
  committed: number,
): number | null {
  if (committed <= 0) return null;
  return Math.round((delivered / committed) * 1000) / 10;
}

/** Barras comparativas Issues e (opcional) Story points para o gráfico headline. */
export function milestoneCommitmentToComparisonBars(
  commitment: MilestoneCommitment,
): MilestoneCommitmentComparisonBar[] {
  const bars: MilestoneCommitmentComparisonBar[] = [
    {
      label: "Issues",
      comprometido: commitment.committed_issues,
      entregue: commitment.delivered_issues,
    },
  ];

  if (commitment.has_story_points) {
    bars.push({
      label: "Story points",
      comprometido: commitment.committed_story_points,
      entregue: commitment.delivered_story_points,
    });
  }

  return bars;
}

/** URL para drill-down de issues não entregues na tabela operacional. */
export function buildMilestoneNotDeliveredHref(
  milestoneIid: number,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    iid: String(milestoneIid),
    issues_metric: "not_delivered",
    ...extraParams,
  });
  return `/milestone?${params.toString()}`;
}

export function formatMilestoneCommitmentWindow(
  startDate: string | null,
  dueDate: string | null,
): string {
  if (!startDate && !dueDate) return "Datas da sprint não definidas";
  if (startDate && dueDate) return `${startDate} → ${dueDate}`;
  return startDate ?? dueDate ?? "—";
}
