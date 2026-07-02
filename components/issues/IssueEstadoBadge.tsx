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
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone.badgeClassName} ${className}`}
    >
      {label}
    </span>
  );
}
