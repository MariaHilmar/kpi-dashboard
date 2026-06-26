"use client";

import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { formatPercentFixed } from "@/lib/format";
import type { FaixaIdade } from "@/types/database";

type Props = {
  rows: FaixaIdade[];
};

export function FaixaIdadeTabela({ rows }: Props) {
  return (
    <TabelaCard<FaixaIdade>
      title="Issues abertas por faixa de idade"
      subtitle="Distribuição etária do backlog"
      columns={[
        { key: "faixa", header: "Faixa de idade" },
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
