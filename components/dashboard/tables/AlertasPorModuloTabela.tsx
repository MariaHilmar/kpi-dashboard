"use client";

import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { formatPercentFixed } from "@/lib/format";
import type { AlertaPorModulo } from "@/types/database";

type Props = {
  title: string;
  rows: AlertaPorModulo[];
};

export function AlertasPorModuloTabela({ title, rows }: Props) {
  return (
    <TabelaCard<AlertaPorModulo>
      title={title}
      columns={[
        { key: "modulo", header: "Módulo" },
        { key: "qtde", header: "Qtde", align: "right" },
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
