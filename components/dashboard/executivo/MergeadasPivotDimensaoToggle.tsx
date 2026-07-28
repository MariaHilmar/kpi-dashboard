"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  DEFAULT_MERGEADAS_PIVOT_DIMENSAO,
  MERGEADAS_PIVOT_DIMENSAO_PARAM,
  type MergeadasPivotDimensao,
  parseMergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";

const OPTIONS: { id: MergeadasPivotDimensao; label: string }[] = [
  { id: "modulo", label: "Módulo" },
  { id: "epico", label: "Épico" },
  { id: "parceria", label: "Parceria" },
];

type Props = {
  selected: MergeadasPivotDimensao;
  onChange: (dimensao: MergeadasPivotDimensao) => void;
};

export function MergeadasPivotDimensaoToggle({ selected, onChange }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      onChange(parseMergeadasPivotDimensao(params.get(MERGEADAS_PIVOT_DIMENSAO_PARAM)));
    }

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [onChange]);

  function setDimensaoInUrl(next: MergeadasPivotDimensao) {
    onChange(next);

    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_MERGEADAS_PIVOT_DIMENSAO) {
      params.delete(MERGEADAS_PIVOT_DIMENSAO_PARAM);
    } else {
      params.set(MERGEADAS_PIVOT_DIMENSAO_PARAM, next);
    }

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", href);
  }

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-slate-600">Agrupar por</legend>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                isSelected
                  ? "border-govbr-blue bg-govbr-blue text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="mergeadasPivotDimensao"
                value={option.id}
                checked={isSelected}
                onChange={() => setDimensaoInUrl(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
