import { ISSUE_LIST_BADGE_CLASS } from "@/lib/dashboard/badge-styles";
import { getIssueStatusTone, resolveIssueWorkflowStatusLabel } from "@/lib/dashboard/issue-status";
import type { IssueRow } from "@/lib/dashboard/issues";

type Props = {
  row: Pick<IssueRow, "status">;
  className?: string;
};

export function IssueStatusBadge({ row, className = "" }: Readonly<Props>) {
  const label = resolveIssueWorkflowStatusLabel(row);
  if (label === "—") {
    return <span className={`text-slate-500 ${className}`}>—</span>;
  }

  const tone = getIssueStatusTone(label);

  return (
    <span className={`${ISSUE_LIST_BADGE_CLASS} ${tone.badgeClassName} ${className}`}>
      {label}
    </span>
  );
}
