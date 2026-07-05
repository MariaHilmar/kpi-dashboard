import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { MilestoneIssuesPagination } from "@/components/dashboard/milestone/MilestoneIssuesPagination";
import { MilestoneIssuesTable } from "@/components/dashboard/milestone/MilestoneIssuesTable";
import type { MilestoneIssuesListParams } from "@/lib/dashboard/milestone-issues-params";
import { fetchMilestoneIssues, type MilestoneDetail } from "@/lib/dashboard/milestone-report";

type MilestoneIssuesSectionProps = {
  milestone: MilestoneDetail;
  listParams: MilestoneIssuesListParams;
};

export async function MilestoneIssuesSection({
  milestone,
  listParams,
}: Readonly<MilestoneIssuesSectionProps>) {
  const result = await fetchMilestoneIssues(milestone.gitlab_milestone_iid, {
    search: listParams.search,
    status: listParams.status,
    estado: listParams.estado,
    metric: listParams.metric,
    order: listParams.order,
    page: listParams.page,
    pageSize: listParams.pageSize,
  });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <CardSectionHeader
        title="Issues da sprint"
        subtitle={`Snapshot milestone_issues — ${result.total.toLocaleString("pt-BR")} issues`}
        tooltip="Espelha o relatório operacional GitLab: peso (Planning Poker), status Kanban, responsável, último comentário e homologação."
      />

      {result.total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhuma issue importada para esta milestone. Sincronize o snapshot em Importar Dados.
        </div>
      ) : (
        <>
          <MilestoneIssuesTable rows={result.rows} />
          <MilestoneIssuesPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
          />
        </>
      )}
    </section>
  );
}
