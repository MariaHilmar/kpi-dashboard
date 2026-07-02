"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  getColumnSortDirection,
  toggleColumnOrder,
  type SortColumn,
} from "@/lib/dashboard/table-sort";

type Props = {
  columnKey: string;
  label: string;
  columns: SortColumn[];
  defaultOrder: string;
  align?: "left" | "right";
  className?: string;
  /** Parâmetros removidos da URL ao ordenar (ex.: paginação). */
  clearParamsOnSort?: string[];
};

function SortIcon({ direction }: Readonly<{ direction: "asc" | "desc" | null }>) {
  if (direction === "asc") {
    return (
      <span aria-hidden="true" className="ml-1 text-govbr-blue">
        ▲
      </span>
    );
  }
  if (direction === "desc") {
    return (
      <span aria-hidden="true" className="ml-1 text-govbr-blue">
        ▼
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="ml-1 text-slate-300">
      ↕
    </span>
  );
}

export function SortableTh({
  columnKey,
  label,
  columns,
  defaultOrder,
  align = "left",
  className = "",
  clearParamsOnSort = [],
}: Readonly<Props>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentOrder = searchParams.get("order") ?? defaultOrder;
  const direction = getColumnSortDirection(currentOrder, columnKey, columns);

  function handleSort() {
    const nextOrder = toggleColumnOrder(currentOrder, columnKey, columns);
    const params = new URLSearchParams(searchParams.toString());
    params.set("order", nextOrder);
    for (const key of clearParamsOnSort) {
      params.delete(key);
    }
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <th
      scope="col"
      className={`px-3 py-2 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <button
        type="button"
        onClick={handleSort}
        className={`inline-flex max-w-full items-center gap-0.5 hover:text-govbr-blue ${
          align === "right" ? "ml-auto" : ""
        } ${direction ? "text-govbr-blue" : ""}`}
        aria-label={`Ordenar por ${label}${
          direction ? ` (${direction === "asc" ? "crescente" : "decrescente"})` : ""
        }`}
      >
        <span className="truncate">{label}</span>
        <SortIcon direction={direction} />
      </button>
    </th>
  );
}
