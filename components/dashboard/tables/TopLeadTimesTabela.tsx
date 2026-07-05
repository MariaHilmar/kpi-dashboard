"use client";

import { IssueEstadoBadge } from "@/components/issues/IssueEstadoBadge";
import { IssueStatusBadge } from "@/components/issues/IssueStatusBadge";
import { TabelaCard } from "@/components/dashboard/TabelaCard";
import { ALERTAS_SECTION_TOOLTIPS } from "@/lib/dashboard/alertas-section-tooltips";
import { formatDate } from "@/lib/format";
import type { TopLeadTime } from "@/types/database";

type Props = {
  rows: TopLeadTime[];
};

export function TopLeadTimesTabela({ rows }: Props) {
  return (
    <TabelaCard<TopLeadTime>
      title="Alertas — maiores lead times"
      subtitle="Top 20 issues mais longas"
      titleTooltip={ALERTAS_SECTION_TOOLTIPS.maioresLeadTimes}
      columns={[
        { key: "id", header: "#", align: "right" },
        {
          key: "titulo",
          header: "Título",
          render: (row) => (
            <span className="block max-w-md truncate" title={row.titulo ?? ""}>
              {row.titulo ?? "—"}
            </span>
          ),
        },
        { key: "modulo", header: "Módulo" },
        {
          key: "estado",
          header: "Estado",
          render: (row) => <IssueEstadoBadge row={{ estado: row.estado }} />,
        },
        {
          key: "status",
          header: "Status",
          render: (row) => <IssueStatusBadge row={{ status: row.status }} />,
        },
        { key: "prioridade", header: "Prioridade" },
        { key: "equipe", header: "Equipe" },
        {
          key: "criado_em",
          header: "Criado em",
          render: (row) => formatDate(row.criado_em),
        },
        {
          key: "fechado_em",
          header: "Fechado em",
          render: (row) => formatDate(row.fechado_em),
        },
        { key: "lead_time", header: "Lead Time", align: "right" },
      ]}
      rows={rows}
    />
  );
}
