"use client";

import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { formatDecimal, formatPercentFixed } from "@/lib/format";
import type { KpiPorTipo } from "@/types/database";

type Props = {
  rows: KpiPorTipo[];
};

export function KpisPorTipoTabela({ rows }: Props) {
  return (
    <TabelaCard<KpiPorTipo>
      title="KPI por tipo de issue"
      subtitle="Volume, eficiência e lead time"
      columns={[
        { key: "tipo", header: "Tipo" },
        { key: "total", header: "Total", align: "right" },
        { key: "abertas", header: "Abertas", align: "right" },
        { key: "fechadas", header: "Fechadas", align: "right" },
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
