"use client";

import { TabelaCard } from "@/components/dashboard/TabelaCard";
import type { FlowBottleneckRow } from "@/lib/dashboard/flow-report";
import { formatDecimal, formatNumber } from "@/lib/format";

type Props = {
  rows: FlowBottleneckRow[];
  highlightEtapa?: string | null;
};

export function FluxoBottlenecksTabela({ rows, highlightEtapa }: Readonly<Props>) {
  return (
    <TabelaCard<FlowBottleneckRow>
      title="Gargalos por etapa"
      subtitle={
        highlightEtapa
          ? `Destaque: ${highlightEtapa} (maior retenção estimada no resumo)`
          : "Volume atual e idade média no fluxo ativo"
      }
      rows={rows}
      emptyMessage="Sem etapas com volume relevante."
      rowClassName={(row) =>
        row.etapa === highlightEtapa
          ? "bg-amber-50 hover:bg-amber-100"
          : "hover:bg-slate-50"
      }
      columns={[
        {
          key: "etapa",
          header: "Etapa",
          render: (row) =>
            row.etapa === highlightEtapa ? (
              <span className="font-semibold text-amber-900">{row.etapa}</span>
            ) : (
              row.etapa
            ),
        },
        {
          key: "quantidade_atual",
          header: "Qtd.",
          align: "right",
          render: (row) => formatNumber(row.quantidade_atual),
        },
        {
          key: "idade_media_dias",
          header: "Idade média",
          align: "right",
          render: (row) =>
            row.idade_media_dias != null ? `${formatDecimal(row.idade_media_dias)} d` : "—",
        },
        {
          key: "maior_idade_dias",
          header: "Maior idade",
          align: "right",
          render: (row) =>
            row.maior_idade_dias === null ? "—" : `${formatNumber(row.maior_idade_dias)} d`,
        },
        {
          key: "observacao",
          header: "Observação",
          className: "max-w-xs",
          render: (row) => row.observacao ?? "—",
        },
      ]}
    />
  );
}
