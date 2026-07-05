"use client";

import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { IssueKeyLink } from "@/components/dashboard/fluxo/IssueKeyLink";
import { FLUXO_TOP10_TABLE_BODY_MAX_HEIGHT } from "@/components/dashboard/fluxo/fluxo-top10-layout";
import { FLUXO_SECTION_TOOLTIPS } from "@/lib/dashboard/fluxo-section-tooltips";
import type { FlowWorkItemAgeRow } from "@/lib/dashboard/flow-report";
import { formatDate, formatNumber } from "@/lib/format";

type Props = {
  rows: FlowWorkItemAgeRow[];
};

export function FluxoWorkItemAgeTabela({ rows }: Readonly<Props>) {
  return (
    <TabelaCard<FlowWorkItemAgeRow>
      title="Top 10 — issues mais antigas em andamento"
      subtitle="Idade = hoje − início do fluxo ativo (A Fazer ou Desenvolvimento)"
      titleTooltip={FLUXO_SECTION_TOOLTIPS.top10Issues}
      bodyMaxHeight={FLUXO_TOP10_TABLE_BODY_MAX_HEIGHT}
      rows={rows}
      columns={[
        {
          key: "issue_key",
          header: "#",
          render: (row) => <IssueKeyLink issueKey={row.issue_key} />,
        },
        {
          key: "titulo",
          header: "Título",
          className: "max-w-[18.667rem] whitespace-normal break-words",
          render: (row) => row.titulo ?? "—",
        },
        { key: "etapa_atual", header: "Etapa" },
        { key: "responsavel", header: "Responsável" },
        {
          key: "data_inicio_fluxo",
          header: "Início fluxo",
          render: (row) => formatDate(row.data_inicio_fluxo),
        },
        {
          key: "dias_em_andamento",
          header: "Dias",
          align: "right",
          render: (row) => formatNumber(row.dias_em_andamento),
        },
      ]}
    />
  );
}
