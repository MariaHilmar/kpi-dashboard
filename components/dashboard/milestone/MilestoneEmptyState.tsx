export type MilestoneEmptyStateType = "no-milestone" | "not-found" | "missing-dates";

interface MilestoneEmptyStateProps {
  type: MilestoneEmptyStateType;
  milestoneIid?: number | null;
}

export function MilestoneEmptyState({
  type,
  milestoneIid,
}: MilestoneEmptyStateProps) {
  const messages = {
    "no-milestone": "Selecione uma sprint ou importe milestones do GitLab em Importar Dados.",
    "not-found": `Milestone ${milestoneIid} não encontrada. Sincronize ou importe os dados da sprint.`,
    "missing-dates":
      "A milestone não possui start_date e due_date definidos. Throughput intra-sprint, lead time e dwell requerem ambas as datas.",
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      {messages[type]}
    </div>
  );
}
