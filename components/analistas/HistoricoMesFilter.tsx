"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { formatAnoMesLabel, listRecentAnoMesOptions } from "@/lib/dashboard/analistas-utils";

const TODOS_MESES = "Todos";

export function HistoricoMesFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const anoMes = searchParams.get("anoMes") ?? TODOS_MESES;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === TODOS_MESES) params.delete("anoMes");
    else params.set("anoMes", value);

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Mês de referência</span>
        <select
          aria-label="Filtrar histórico por mês"
          value={anoMes}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          <option value={TODOS_MESES}>Todos os meses</option>
          {listRecentAnoMesOptions().map((option) => (
            <option key={option} value={option}>
              {formatAnoMesLabel(option)}
            </option>
          ))}
        </select>
      </label>

      {isPending ? <span className="pb-2 text-xs text-slate-400">Atualizando…</span> : null}
    </div>
  );
}
