import type { AnalistaRelatorioKpis } from "@/types/analistas";
import { formatNumber } from "@/lib/format";

type Props = {
  kpis: AnalistaRelatorioKpis;
};

const ITEMS = [
  { key: "total", label: "Total de Issues" },
  { key: "abertas", label: "Abertas" },
  { key: "fechadas", label: "Fechadas" },
  { key: "canceladas", label: "Canceladas" },
  { key: "entregues", label: "Entregues" },
  { key: "doing", label: "Doing" },
] as const;

export function AnalistasKpiStrip({ kpis }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
      {ITEMS.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatNumber(kpis[item.key])}
          </p>
        </div>
      ))}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-3 xl:col-span-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sprint atual</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{kpis.sprint_atual ?? "—"}</p>
      </div>
    </div>
  );
}
