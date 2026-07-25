"use client";

import { useSearchParams } from "next/navigation";

import { KpiCard } from "@/components/dashboard/KpiCard";
import { EXECUTIVO_SECTION_TOOLTIPS } from "@/lib/dashboard/executivo-section-tooltips";
import { buildKpiIssuesHref } from "@/lib/dashboard/issuesLinks";
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

  const kpiHref = (preset: Parameters<typeof buildKpiIssuesHref>[1]) =>
    buildKpiIssuesHref(searchParams, preset);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label="Total de issues"
        value={formatNumber(kpis.total)}
        accent="info"
        issuesHref={kpiHref("total")}
        issueCount={kpis.total}
      />
      <KpiCard
        label="Issues fechadas"
        value={formatNumber(kpis.fechadas)}
        accent="success"
        issuesHref={kpiHref("fechadas")}
        issueCount={kpis.fechadas}
      />
      <KpiCard
        label="Issues abertas"
        value={formatNumber(kpis.abertas)}
        accent="warning"
        issuesHref={kpiHref("abertas")}
        issueCount={kpis.abertas}
      />
      <KpiCard
        label="Taxa de fechamento"
        value={formatPercent(kpis.taxa_fechamento)}
        tooltip={EXECUTIVO_SECTION_TOOLTIPS.taxaFechamento}
      />
      <KpiCard
        label="Lead time médio"
        value={formatNumber(kpis.lead_time_medio)}
        hint="dias (issues fechadas)"
        tooltip={EXECUTIVO_SECTION_TOOLTIPS.leadTimeMedio}
      />
      <KpiCard
        label="Bugs abertos"
        value={formatNumber(kpis.bugs_abertos)}
        accent="danger"
        issuesHref={kpiHref("bugs_abertos")}
        issueCount={kpis.bugs_abertos}
      />
      <KpiCard
        label="Melhorias abertas"
        value={formatNumber(kpis.melhorias_abertas)}
        issuesHref={kpiHref("melhorias_abertas")}
        issueCount={kpis.melhorias_abertas}
      />
      <KpiCard
        label="Issues sem tipo definido"
        value={formatNumber(kpis.sem_tipo)}
        issuesHref={kpiHref("sem_tipo")}
        issueCount={kpis.sem_tipo}
      />
      <KpiCard
        label="% Bugs no backlog"
        value={formatPercent(kpis.pct_bugs_backlog)}
        accent="warning"
        tooltip={EXECUTIVO_SECTION_TOOLTIPS.pctBugsBacklog}
      />
      <KpiCard
        label="Taxa fech. Bug"
        value={formatPercent(kpis.taxa_fech_bug)}
        tooltip={EXECUTIVO_SECTION_TOOLTIPS.taxaFechBug}
      />
    </div>
  );
}

export { KpiCard } from "@/components/dashboard/KpiCard";
export type { KpiCardProps } from "@/components/dashboard/KpiCard";
