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
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone.badgeClassName} ${className}`}
    >
      {label}
    </span>
  );
}
