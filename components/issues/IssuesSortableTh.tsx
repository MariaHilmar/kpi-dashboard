"use client";

import { SortableTh } from "@/components/ui/SortableTh";
import {
  DEFAULT_ISSUE_LIST_ORDER,
  ISSUE_LIST_SORT_COLUMNS,
} from "@/lib/dashboard/issue-list-sort";

type Props = {
  columnKey: string;
  label: string;
  align?: "left" | "right";
  className?: string;
};

export function IssuesSortableTh(props: Props) {
  return (
    <SortableTh
      {...props}
      columns={ISSUE_LIST_SORT_COLUMNS}
      defaultOrder={DEFAULT_ISSUE_LIST_ORDER}
      clearParamsOnSort={["page"]}
      className={`font-medium ${props.className ?? ""}`}
    />
  );
}
