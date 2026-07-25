"use client";

import { filtersToSearchParams } from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/types/database";

type Props = {
  filters: DashboardFilters;
};

const BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50";

/** Exporta TODA a página Executivo (KPIs, evolução, distribuição, detalhamento e mergeadas). */
export function ExecutivoExportBar({ filters }: Props) {
  const qs = filtersToSearchParams(filters).toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <a className={BTN_CLASS} href={`/api/executivo/export${suffix}`}>
        Exportar Excel
      </a>
      <a
        className={BTN_CLASS}
        href={`/executivo/imprimir${suffix}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Imprimir PDF (A4)
      </a>
      <a className={BTN_CLASS} href={`/api/executivo/export/word${suffix}`}>
        Exportar Word (A4)
      </a>
    </div>
  );
}
