"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { TODOS } from "@/lib/dashboard/constants";
import { formatAnoMesLabel, listRecentAnoMesOptions } from "@/lib/dashboard/analistas-utils";

type Props = {
  sprints: string[];
  autores: string[];
  defaultAutor: string;
};

export function AnalistasFilters({ sprints, autores, defaultAutor }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const anoMes = searchParams.get("anoMes") ?? listRecentAnoMesOptions()[0];
  const sprint = searchParams.get("sprint") ?? TODOS;
  const autor = searchParams.get("autor") ?? defaultAutor;

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Autor(a)</span>
        <select
          aria-label="Filtrar por autor da issue"
          value={autor}
          onChange={(event) => {
            pushParams((params) => {
              const value = event.target.value;
              if (value === TODOS) params.delete("autor");
              else params.set("autor", value);
            });
          }}
          className="min-w-[14rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          <option value={TODOS}>Todos os autores</option>
          {autores
            .filter((item) => item !== TODOS)
            .map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Mês de referência</span>
        <select
          aria-label="Mês de referência"
          value={anoMes}
          onChange={(event) => {
            pushParams((params) => {
              params.set("anoMes", event.target.value);
            });
          }}
          className="min-w-[10rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          {listRecentAnoMesOptions().map((option) => (
            <option key={option} value={option}>
              {formatAnoMesLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600">Sprint</span>
        <select
          aria-label="Filtrar por sprint"
          value={sprint}
          onChange={(event) => {
            pushParams((params) => {
              const value = event.target.value;
              if (value === TODOS) params.delete("sprint");
              else params.set("sprint", value);
            });
          }}
          className="min-w-[12rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
        >
          <option value={TODOS}>Todas as sprints</option>
          {sprints
            .filter((item) => item !== TODOS)
            .map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </label>

      {isPending ? <span className="pb-2 text-xs text-slate-400">Atualizando…</span> : null}
    </div>
  );
}
