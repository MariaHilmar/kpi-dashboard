"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { flowPeriodPresets } from "@/lib/dashboard/flow-charts";

type FluxoFiltersProps = {
  startDate: string;
  endDate: string;
  assignee: string;
  granularity: "week" | "month";
};

export function FluxoFilters({
  startDate,
  endDate,
  assignee,
  granularity,
}: FluxoFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const presets = flowPeriodPresets();

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function applyPreset(start: string, end: string) {
    pushParams({ start_date: start, end_date: end });
  }

  const activePreset = presets.find(
    (preset) => preset.startDate === startDate && preset.endDate === endDate,
  )?.id;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Filtros do fluxo</h2>
          <p className="text-xs text-slate-500">
            Período, responsável e granularidade. Demais filtros usam a barra global acima.
          </p>
        </div>
        {isPending ? <span className="text-xs text-slate-400">Atualizando…</span> : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.startDate, preset.endDate)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activePreset === preset.id
                ? "border-govbr-blue bg-govbr-blue text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Início</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => pushParams({ start_date: event.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Fim</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => pushParams({ end_date: event.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Responsável</span>
          <input
            type="search"
            placeholder="Nome ou username"
            defaultValue={assignee === "Todos" ? "" : assignee}
            onBlur={(event) => {
              const value = event.target.value.trim();
              pushParams({ assignee: value || null });
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              const value = (event.target as HTMLInputElement).value.trim();
              pushParams({ assignee: value || null });
            }}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600">Granularidade</span>
          <select
            value={granularity}
            onChange={(event) =>
              pushParams({ granularity: event.target.value as "week" | "month" })
            }
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="week">Semanal</option>
            <option value="month">Mensal</option>
          </select>
        </label>
      </div>
    </section>
  );
}
