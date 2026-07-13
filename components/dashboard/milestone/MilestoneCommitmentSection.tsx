import { MilestoneCommitmentPanel } from "@/components/dashboard/milestone/MilestoneCommitmentPanel";
import { MilestoneIssuesTable } from "@/components/dashboard/milestone/MilestoneIssuesTable";
import { MilestoneSectionNotice } from "@/components/dashboard/milestone/MilestoneSectionNotice";
import { CardSectionHeader } from "@/components/dashboard/CardSectionHeader";
import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import {
  buildMilestoneNotDeliveredHref,
  milestoneCommitmentToComparisonBars,
} from "@/lib/dashboard/milestone-commitment";
import {
  fetchMilestoneCommitment,
  fetchMilestoneIssues,
  type MilestoneDetail,
} from "@/lib/dashboard/milestone-report";
import { formatNumber } from "@/lib/format";

const NOT_DELIVERED_PREVIEW = 15;

type MilestoneCommitmentSectionProps = {
  milestone: MilestoneDetail;
};

export async function MilestoneCommitmentSection({
  milestone,
}: Readonly<MilestoneCommitmentSectionProps>) {
  const [commitment, notDeliveredPreview] = await Promise.all([
    fetchMilestoneCommitment(milestone.gitlab_milestone_iid),
    fetchMilestoneIssues(milestone.gitlab_milestone_iid, {
      metric: "not_delivered",
      pageSize: NOT_DELIVERED_PREVIEW,
      order: "story_points_desc",
    }),
  ]);

  if (!commitment) {
    return (
      <MilestoneSectionNotice>
        Dados de comprometimento indisponíveis para esta milestone.
      </MilestoneSectionNotice>
    );
  }

  const comparisonBars = milestoneCommitmentToComparisonBars(commitment);
  const notDeliveredHref = buildMilestoneNotDeliveredHref(milestone.gitlab_milestone_iid);

  return (
    <div className="flex flex-col gap-6">
      <MilestoneCommitmentPanel
        milestoneIid={milestone.gitlab_milestone_iid}
        commitment={commitment}
        comparisonBars={comparisonBars}
      />

      {notDeliveredPreview.total > 0 ? (
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <CardSectionHeader
            title="Issues não entregues"
            subtitle={`${formatNumber(notDeliveredPreview.total)} no carry implícito`}
            tooltip="Issues do snapshot que não fecharam dentro de start_date–due_date, ou sem fechado_em sincronizado."
          />

          <MilestoneIssuesTable rows={notDeliveredPreview.rows} />

          {notDeliveredPreview.total > NOT_DELIVERED_PREVIEW ? (
            <p className="text-sm text-slate-600">
              Exibindo {NOT_DELIVERED_PREVIEW} de {formatNumber(notDeliveredPreview.total)}.{" "}
              <IssueCountLink
                count={notDeliveredPreview.total}
                href={notDeliveredHref}
                label="ver todas não entregues"
              >
                <span className="font-medium text-blue-700 hover:underline">
                  Ver todas na tabela operacional
                </span>
              </IssueCountLink>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
