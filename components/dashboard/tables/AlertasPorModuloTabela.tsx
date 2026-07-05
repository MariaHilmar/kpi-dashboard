"use client";



import { IssueCountLink } from "@/components/dashboard/IssueCountLink";

import { TabelaCard } from "@/components/dashboard/TabelaCard";

import { type AlertaDimensao } from "@/lib/dashboard/constants";

import { buildAlertasPorModuloIssuesHref } from "@/lib/dashboard/issuesLinks";

import { formatNumber, formatPercentFixed } from "@/lib/format";

import type { AlertaPorModulo, DashboardFilters } from "@/types/database";



type Props = {

  title: string;

  titleTooltip?: string;

  dimensao: AlertaDimensao;

  filters: DashboardFilters;

  rows: AlertaPorModulo[];

};



export function AlertasPorModuloTabela({ title, titleTooltip, dimensao, filters, rows }: Props) {

  return (

    <TabelaCard<AlertaPorModulo>

      title={title}

      titleTooltip={titleTooltip}

      columns={[

        { key: "modulo", header: "Módulo" },

        {

          key: "qtde",

          header: "Qtde",

          align: "right",

          render: (row) => (

            <IssueCountLink

              count={row.qtde}

              href={buildAlertasPorModuloIssuesHref(filters, dimensao, row.modulo)}

              label={row.modulo}

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

