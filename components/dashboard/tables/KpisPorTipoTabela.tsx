"use client";

import { IssueCountLink } from "@/components/dashboard/IssueCountLink";
import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { DETALHAMENTO_SECTION_TOOLTIPS } from "@/lib/dashboard/detalhamento-section-tooltips";
import { KPI_POR_TIPO_ISSUES_SUBTITLE } from "@/lib/dashboard/executivo-chart-labels";
import { buildAggregateIssuesHref } from "@/lib/dashboard/issuesLinks";
import { formatDecimal, formatNumber, formatPercentFixed } from "@/lib/format";
import type { DashboardFilters, KpiPorTipo } from "@/types/database";

type Props = {
  filters: DashboardFilters;
  rows: KpiPorTipo[];
};

export function KpisPorTipoTabela({ filters, rows }: Props) {
  return (
    <TabelaCard<KpiPorTipo>
      title="KPI por tipo de issue"
      subtitle={KPI_POR_TIPO_ISSUES_SUBTITLE}
      titleTooltip={DETALHAMENTO_SECTION_TOOLTIPS.kpisPorTipo}
      columns={[
        { key: "tipo", header: "Tipo" },
        {
          key: "total",
          header: "Total",
          align: "right",
          render: (row) => (
            <IssueCountLink
              count={row.total}
              href={buildAggregateIssuesHref(filters, "tipo", row.tipo)}
              label={`${row.tipo} — total`}
            >
              {formatNumber(row.total)}
            </IssueCountLink>
          ),
        },
        {
          key: "abertas",
          header: "Abertas",
          align: "right",
          render: (row) => (
            <IssueCountLink
              count={row.abertas}
              href={buildAggregateIssuesHref(filters, "tipo", row.tipo, { estado: "open" })}
              label={`${row.tipo} — abertas`}
            >
              {formatNumber(row.abertas)}
            </IssueCountLink>
          ),
        },
        {
          key: "fechadas",
          header: "Fechadas",
          align: "right",
          render: (row) => (
            <IssueCountLink
              count={row.fechadas}
              href={buildAggregateIssuesHref(filters, "tipo", row.tipo, { estado: "closed" })}
              label={`${row.tipo} — fechadas`}
            >
              {formatNumber(row.fechadas)}
            </IssueCountLink>
          ),
        },
        {
          key: "taxa_fechamento",
          header: "Taxa fech.",
          align: "right",
          render: (row) => formatPercentFixed(row.taxa_fechamento),
        },
        {
          key: "lead_medio",
          header: "Lead médio",
          align: "right",
          render: (row) => formatDecimal(row.lead_medio),
        },
        {
          key: "lead_mediano",
          header: "Lead mediano",
          align: "right",
          render: (row) => formatDecimal(row.lead_mediano),
        },
      ]}
      rows={rows}
    />
  );
}
