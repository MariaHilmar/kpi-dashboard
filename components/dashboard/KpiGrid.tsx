"use client";

import { useSearchParams } from "next/navigation";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { buildIssuesHref } from "@/lib/dashboard/issuesLinks";
import { formatNumber, formatPercent } from "@/lib/format";
import type { DashboardKpisFull } from "@/types/database";

type KpiGridProps = {
  kpis: DashboardKpisFull | null;
};

export function KpiGrid({ kpis }: KpiGridProps) {
  const searchParams = useSearchParams();

  if (!kpis) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        KPIs indisponíveis. Execute as migrations no Supabase e sincronize os dados.
      </div>
    );
  }

  const issuesHref = (extra?: Record<string, string>) =>
    buildIssuesHref(searchParams, extra);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard label="Total filtrado" value={formatNumber(kpis.total)} accent="info" href={issuesHref()} />
      <KpiCard
        label="Fechadas"
        value={formatNumber(kpis.fechadas)}
        accent="success"
        href={issuesHref({ estado: "closed" })}
      />
      <KpiCard
        label="Abertas"
        value={formatNumber(kpis.abertas)}
        accent="warning"
        href={issuesHref({ estado: "open" })}
      />
      <KpiCard label="Taxa de fechamento" value={formatPercent(kpis.taxa_fechamento)} />
      <KpiCard label="Lead time médio" value={formatNumber(kpis.lead_time_medio)} hint="dias" />
      <KpiCard
        label="Bugs abertos"
        value={formatNumber(kpis.bugs_abertos)}
        accent="danger"
        href={issuesHref({ estado: "open" })}
      />
      <KpiCard
        label="Melhorias abertas"
        value={formatNumber(kpis.melhorias_abertas)}
        href={issuesHref({ estado: "open" })}
      />
      <KpiCard label="Sem tipo" value={formatNumber(kpis.sem_tipo)} />
      <KpiCard label="% Bugs no backlog" value={formatPercent(kpis.pct_bugs_backlog)} accent="warning" />
      <KpiCard label="Taxa fech. Bug" value={formatPercent(kpis.taxa_fech_bug)} />
    </div>
  );
}

export { KpiCard } from "@/components/dashboard/KpiCard";
export type { KpiCardProps } from "@/components/dashboard/KpiCard";
