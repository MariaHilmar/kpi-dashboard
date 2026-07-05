import { IssueEstadoBadge } from "@/components/issues/IssueEstadoBadge";
import { IssueStatusBadge } from "@/components/issues/IssueStatusBadge";
import { IssuesSortableTh } from "@/components/issues/IssuesSortableTh";
import { StoryPointsBadge } from "@/components/issues/StoryPointsBadge";
import { gitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import {
  ISSUES_OPTIONAL_COLUMNS,
  isIssuesOptionalColumnVisible,
  type IssuesOptionalColumnKey,
} from "@/lib/dashboard/issues-table-columns";
import type { IssueRow } from "@/lib/dashboard/issues";
import { formatDate, formatNumber } from "@/lib/format";

const COMPACT_COLUMN = "w-[5rem] max-w-[5rem]";
const COMPACT_CELL =
  "max-w-[5rem] break-words px-3 py-2 align-top leading-snug text-slate-600 [overflow-wrap:anywhere]";
/** 70% de max-w-md (28rem) */
const TITULO_COLUMN = "w-[19.6rem] max-w-[19.6rem]";
const TITULO_CELL = "max-w-[19.6rem] min-w-0 px-3 py-2 text-slate-900";

type Props = {
  rows: IssueRow[];
  visibleColumns?: readonly IssuesOptionalColumnKey[];
};

function formatOptionalNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return formatNumber(value);
}

function renderOptionalCell(row: IssueRow, key: IssuesOptionalColumnKey) {
  switch (key) {
    case "story_points":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-right">
          <StoryPointsBadge value={row.story_points} />
        </td>
      );
    case "aceita":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-slate-600">
          {row.aceita ?? "—"}
        </td>
      );
    case "homologado":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-slate-600">
          {row.homologado ?? "—"}
        </td>
      );
    case "horas_estimada":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
          {formatOptionalNumber(row.horas_estimada)}
        </td>
      );
    case "horas_prevista":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
          {formatOptionalNumber(row.horas_prevista)}
        </td>
      );
    case "justificada":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-slate-600">
          {row.justificada ?? "—"}
        </td>
      );
    case "recorrente":
      return (
        <td key={key} className="whitespace-nowrap px-3 py-2 text-slate-600">
          {row.recorrente ?? "—"}
        </td>
      );
    default:
      return null;
  }
}

export function IssuesTable({ rows, visibleColumns = [] }: Props) {
  const optionalColumns = ISSUES_OPTIONAL_COLUMNS.filter((column) =>
    isIssuesOptionalColumnVisible(visibleColumns, column.key),
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nenhuma issue encontrada para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
        <caption className="sr-only">
          Lista de issues filtradas, com módulo, tipo, estado, status, prazos e campos Planning Poker
        </caption>
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <IssuesSortableTh columnKey="id" label="ID" />
            <IssuesSortableTh columnKey="titulo" label="Título" className={TITULO_COLUMN} />
            <IssuesSortableTh columnKey="modulo" label="Módulo" className={COMPACT_COLUMN} />
            <IssuesSortableTh columnKey="tipo" label="Tipo" className={COMPACT_COLUMN} />
            <IssuesSortableTh columnKey="estado" label="Estado" />
            <IssuesSortableTh columnKey="status" label="Status" />
            <IssuesSortableTh columnKey="prioridade" label="Prioridade" />
            <IssuesSortableTh columnKey="equipe" label="Equipe" />
            <IssuesSortableTh columnKey="parceria" label="Parceria" />
            {optionalColumns.map((column) =>
              column.sortKey ? (
                <IssuesSortableTh
                  key={column.key}
                  columnKey={column.sortKey}
                  label={column.label}
                  align={column.align}
                />
              ) : (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-3 py-2 font-medium ${column.align === "right" ? "text-right" : ""}`}
                >
                  {column.label}
                </th>
              ),
            )}
            <IssuesSortableTh columnKey="criado" label="Criado" />
            <IssuesSortableTh columnKey="fechado" label="Data de Fechamento" />
            <IssuesSortableTh columnKey="lead" label="Lead (d)" align="right" />
            <IssuesSortableTh columnKey="idade" label="Idade (d)" align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const issueUrl = gitlabWorkItemUrl(row.gitlab_repo, row.gitlab_iid);

            return (
              <tr key={`${row.gitlab_repo}-${row.gitlab_iid}-${index}`} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                  {issueUrl ? (
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-govbr-blue hover:underline"
                    >
                      {row.gitlab_iid ?? "—"}
                    </a>
                  ) : (
                    row.gitlab_iid ?? "—"
                  )}
                </td>
                <td className={TITULO_CELL}>
                  <span className="line-clamp-2">{row.titulo ?? "—"}</span>
                  {row.sla_mais_90_dias ? (
                    <span className="ml-1 inline-flex rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                      SLA &gt; 90d
                    </span>
                  ) : null}
                </td>
                <td className={COMPACT_CELL}>{row.modulo ?? "—"}</td>
                <td className={COMPACT_CELL}>{row.tipo ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueEstadoBadge row={row} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueStatusBadge row={row} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.prioridade ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.equipe ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.parceria ?? "—"}</td>
                {optionalColumns.map((column) => renderOptionalCell(row, column.key))}
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(row.criado_em)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(row.fechado_em)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                  {formatNumber(row.lead_time_dias)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                  {formatNumber(row.idade_dias)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
