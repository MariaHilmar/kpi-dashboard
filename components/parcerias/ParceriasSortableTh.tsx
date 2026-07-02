"use client";

import { SortableTh } from "@/components/ui/SortableTh";
import {
  PARCERIAS_SORT_COLUMNS,
  parceriasDefaultOrder,
} from "@/lib/dashboard/parcerias-sort";
import { TODOS } from "@/lib/dashboard/constants";
import { useSearchParams } from "next/navigation";

type Props = {
  columnKey: string;
  label: string;
  className?: string;
};

export function ParceriasSortableTh({ columnKey, label, className = "" }: Props) {
  const searchParams = useSearchParams();
  const parceiro = searchParams.get("parceiro") ?? TODOS;

  return (
    <SortableTh
      columnKey={columnKey}
      label={label}
      columns={PARCERIAS_SORT_COLUMNS}
      defaultOrder={parceriasDefaultOrder(parceiro)}
      className={`text-xs font-semibold uppercase tracking-wide text-slate-600 ${className}`}
    />
  );
}
