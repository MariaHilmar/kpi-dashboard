"use client";

import { IssueDrilldownLink } from "@/components/dashboard/IssueDrilldownLink";
import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { buildFaixaIdadeIssuesHref } from "@/lib/dashboard/issuesLinks";
import { formatNumber, formatPercentFixed } from "@/lib/format";
import type { DashboardFilters, FaixaIdade } from "@/types/database";

type Props = {
  filters: DashboardFilters;
  rows: FaixaIdade[];
};

export function FaixaIdadeTabela({ filters, rows }: Props) {
  return (
    <TabelaCard<FaixaIdade>
      title="Issues abertas por faixa de idade"
      subtitle="Distribuição etária do backlog — clique na quantidade para ver as issues"
      columns={[
        {
          key: "faixa",
          header: "Faixa de idade",
          render: (row) => {
            if (row.qtde <= 0) return row.faixa;
            const href = buildFaixaIdadeIssuesHref(filters, row.faixa);
            return (
              <IssueDrilldownLink href={href} title={`Ver issues — ${row.faixa}`}>
                {row.faixa}
              </IssueDrilldownLink>
            );
          },
        },
        {
          key: "qtde",
          header: "Qtde",
          align: "right",
          render: (row) => {
            if (row.qtde <= 0) return formatNumber(row.qtde);
            const href = buildFaixaIdadeIssuesHref(filters, row.faixa);
            return (
              <IssueDrilldownLink href={href} title={`Ver ${row.qtde} issues — ${row.faixa}`}>
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
