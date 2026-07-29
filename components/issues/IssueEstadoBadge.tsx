import { ISSUE_LIST_BADGE_CLASS } from "@/lib/dashboard/badge-styles";
import { getIssueEstadoTone, resolveIssueEstadoLabel } from "@/lib/dashboard/issue-estado-display";
import type { IssueRow } from "@/lib/dashboard/issues";

type Props = {
  row: Pick<IssueRow, "estado">;
  className?: string;
};

export function IssueEstadoBadge({ row, className = "" }: Readonly<Props>) {
  const label = resolveIssueEstadoLabel(row);
  const tone = getIssueEstadoTone(row);

  return (
    <span className={`${ISSUE_LIST_BADGE_CLASS} ${tone.badgeClassName} ${className}`}>
      {label}
    </span>
  );
}
