import type { AnalistaRelatorioKpis } from "@/types/analistas";
import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import {
  buildAnalistaIssuesHref,
  type AnalistaIssuesContext,
} from "@/lib/dashboard/issuesLinks";
import { formatNumber } from "@/lib/format";

type Props = {
  kpis: AnalistaRelatorioKpis;
  context: AnalistaIssuesContext;
};

type KpiKey = Exclude<keyof AnalistaRelatorioKpis, "sprint_atual">;

// `estado` reproduzível na listagem /issues; canceladas/entregues/doing dependem de
// status textual (ilike) e não têm filtro exato equivalente, então não recebem link.
const ITEMS: { key: KpiKey; label: string; estado?: "open" | "closed" }[] = [
  { key: "total", label: "Total de Issues" },
  { key: "abertas", label: "Abertas", estado: "open" },
  { key: "fechadas", label: "Fechadas", estado: "closed" },
  { key: "canceladas", label: "Canceladas" },
  { key: "entregues", label: "Entregues" },
  { key: "doing", label: "Em execução" },
];

export function AnalistasKpiStrip({ kpis, context }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
      {ITEMS.map((item) => {
        const count = kpis[item.key];
        const linkable = item.key === "total" || item.estado !== undefined;
        const href = linkable
          ? buildAnalistaIssuesHref(
              context,
              item.estado ? { estado: item.estado } : undefined,
            )
          : null;
        return (
          <div
            key={item.key}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              <IssueCountLink count={count} href={href} label={item.label}>
                {formatNumber(count)}
              </IssueCountLink>
            </p>
          </div>
        );
      })}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-3 xl:col-span-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sprint atual</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{kpis.sprint_atual ?? "—"}</p>
      </div>
    </div>
  );
}
