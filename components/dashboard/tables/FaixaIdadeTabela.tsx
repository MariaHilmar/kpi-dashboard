"use client";



import { IssueCountLink } from "@/components/dashboard/IssueCountLink";

import { IssueDrilldownLink } from "@/components/dashboard/IssueDrilldownLink";

import { TabelaCard } from "@/components/dashboard/TabelaCard";

import { ALERTAS_SECTION_TOOLTIPS } from "@/lib/dashboard/alertas-section-tooltips";

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

      titleTooltip={ALERTAS_SECTION_TOOLTIPS.faixaIdade}

      columns={[

        {

          key: "faixa",

          header: "Faixa de idade",

          render: (row) => {

            const href = buildFaixaIdadeIssuesHref(filters, row.faixa);

            if (row.qtde <= 0) return row.faixa;

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

          render: (row) => (

            <IssueCountLink

              count={row.qtde}

              href={buildFaixaIdadeIssuesHref(filters, row.faixa)}

              label={row.faixa}

            >

              {formatNumber(row.qtde)}

            </IssueCountLink>

          ),

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

