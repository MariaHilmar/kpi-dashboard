"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  getIssueColumnSortDirection,
  toggleIssueColumnOrder,
} from "@/lib/dashboard/issueOrders";

type Props = {
  columnKey: string;
  label: string;
  align?: "left" | "right";
};

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  if (direction === "asc") {
    return <span aria-hidden="true" className="ml-1 text-govbr-blue">▲</span>;
  }
  if (direction === "desc") {
    return <span aria-hidden="true" className="ml-1 text-govbr-blue">▼</span>;
  }
  return <span aria-hidden="true" className="ml-1 text-slate-300">↕</span>;
}

export function IssuesSortableTh({ columnKey, label, align = "left" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentOrder = searchParams.get("order") ?? "criado_em_desc";
  const direction = getIssueColumnSortDirection(currentOrder, columnKey);

  function handleSort() {
    const nextOrder = toggleIssueColumnOrder(currentOrder, columnKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("order", nextOrder);
    params.delete("page");
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <th
      scope="col"
      className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={handleSort}
        className={`inline-flex items-center gap-0.5 hover:text-govbr-blue ${
          align === "right" ? "ml-auto" : ""
        } ${direction ? "text-govbr-blue" : ""}`}
        aria-label={`Ordenar por ${label}${direction ? ` (${direction === "asc" ? "crescente" : "decrescente"})` : ""}`}
      >
        {label}
        <SortIcon direction={direction} />
      </button>
    </th>
  );
}
