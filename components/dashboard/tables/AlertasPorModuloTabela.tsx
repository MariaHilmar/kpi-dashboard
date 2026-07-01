"use client";

import { IssueDrilldownLink } from "@/components/dashboard/IssueDrilldownLink";
import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { type AlertaDimensao } from "@/lib/dashboard/constants";
import { buildAlertasPorModuloIssuesHref } from "@/lib/dashboard/issuesLinks";
import { formatNumber, formatPercentFixed } from "@/lib/format";
import type { AlertaPorModulo, DashboardFilters } from "@/types/database";

type Props = {
  title: string;
  dimensao: AlertaDimensao;
  filters: DashboardFilters;
  rows: AlertaPorModulo[];
};

export function AlertasPorModuloTabela({ title, dimensao, filters, rows }: Props) {
  return (
    <TabelaCard<AlertaPorModulo>
      title={title}
      columns={[
        { key: "modulo", header: "Módulo" },
        {
          key: "qtde",
          header: "Qtde",
          align: "right",
          render: (row) => {
            if (row.qtde <= 0) return formatNumber(row.qtde);
            const href = buildAlertasPorModuloIssuesHref(filters, dimensao, row.modulo);
            return (
              <IssueDrilldownLink href={href} title={`Ver ${row.qtde} issues — ${row.modulo}`}>
                {formatNumber(row.qtde)}
              </IssueDrilldownLink>
            );
          },
        },
        {
          key: "percentual",
          header: "%",
          align: "right",
          render: (row) => formatPercentFixed(row.percentual),
        },
      ]}
      rows={rows}
    />
  );
}
