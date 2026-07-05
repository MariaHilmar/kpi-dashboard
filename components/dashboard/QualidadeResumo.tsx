"use client";

import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { buildAlertasResumoIssuesHref } from "@/lib/dashboard/issuesLinks";
import { QUALIDADE_SECTION_TOOLTIPS } from "@/lib/dashboard/qualidade-section-tooltips";
import { formatNumber } from "@/lib/format";
import type { AlertaResumo, DashboardFilters } from "@/types/database";

type QualidadeResumoProps = {
  data: AlertaResumo | null;
  filters: DashboardFilters;
};

export function QualidadeResumo({ data, filters }: QualidadeResumoProps) {
  if (!data) return null;

  const cards = [
    {
      label: "Issues sem épicos definidos",
      value: data.sem_epico,
      color: "bg-yellow-50 border-yellow-200",
      href:
        data.sem_epico > 0 ? buildAlertasResumoIssuesHref(filters, "sem_epico") : null,
      tooltip: QUALIDADE_SECTION_TOOLTIPS.semEpicoDados,
    },
    {
      label: "Issues sem parcerias definidas",
      value: data.sem_parceria,
      color: "bg-rose-50 border-rose-200",
      href:
        data.sem_parceria > 0 ? buildAlertasResumoIssuesHref(filters, "sem_parceria") : null,
      tooltip: QUALIDADE_SECTION_TOOLTIPS.semParceriaDados,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              {card.label}
            </p>
            <InfoTooltip text={card.tooltip} />
          </div>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            <IssueCountLink count={card.value} href={card.href} label={card.label}>
              {formatNumber(card.value)}
            </IssueCountLink>
          </p>
        </div>
      ))}
    </div>
  );
}
