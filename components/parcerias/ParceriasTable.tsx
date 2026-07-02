import { IssueEstadoBadge } from "@/components/issues/IssueEstadoBadge";
import { IssueStatusBadge } from "@/components/issues/IssueStatusBadge";
import { ParceriasSortableTh } from "@/components/parcerias/ParceriasSortableTh";
import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import type { IssueRow } from "@/lib/dashboard/issues";
import {
  formatParceriasDate,
  formatParceriasText,
} from "@/lib/dashboard/parcerias-display";

const COMPACT_HEADER = "w-[5rem] max-w-[5rem]";
const COMPACT_CELL =
  "max-w-[5rem] break-words px-3 py-2 align-top leading-snug text-slate-600 [overflow-wrap:anywhere]";
/** 70% da largura anterior (~16rem) */
const TITULO_HEADER = "w-[11.2rem] max-w-[11.2rem]";
const TITULO_CELL =
  "max-w-[11.2rem] min-w-0 break-words px-3 py-2 align-top leading-snug text-slate-800 [overflow-wrap:anywhere]";

type Props = {
  rows: IssueRow[];
  showParceriaColumn: boolean;
};

export function ParceriasTable({ rows, showParceriaColumn }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Nenhuma demanda encontrada para a parceria e o período selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {showParceriaColumn ? (
              <ParceriasSortableTh columnKey="parceria" label="Parceria" className="w-[4.5rem]" />
            ) : null}
            <ParceriasSortableTh columnKey="id" label="Issue" className="w-[3.5rem]" />
            <ParceriasSortableTh columnKey="titulo" label="Título" className={TITULO_HEADER} />
            <ParceriasSortableTh columnKey="modulo" label="Módulo" className={COMPACT_HEADER} />
            <ParceriasSortableTh columnKey="tipo" label="Tipo" className={COMPACT_HEADER} />
            <ParceriasSortableTh columnKey="estado" label="Estado" className="w-[4.5rem]" />
            <ParceriasSortableTh columnKey="status" label="Status" className="w-[5.5rem]" />
            <ParceriasSortableTh columnKey="prioridade" label="Prioridade" className="w-[4.5rem]" />
            <ParceriasSortableTh columnKey="criado" label="Criado em" className="w-[5.5rem]" />
            <ParceriasSortableTh columnKey="entrega" label="Data prevista" className="w-[5.5rem]" />
            <ParceriasSortableTh columnKey="fechado" label="Fechado em" className="w-[5.5rem]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const url = resolveGitlabWorkItemUrl({
              gitlabRepo: row.gitlab_repo,
              gitlabIid: row.gitlab_iid,
            });
            const key = `${row.gitlab_repo ?? "repo"}:${row.gitlab_iid ?? row.titulo}`;

            return (
              <tr key={key} className="border-b border-slate-100 last:border-0">
                {showParceriaColumn ? (
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {formatParceriasText(row.parceria)}
                  </td>
                ) : null}
                <td className="whitespace-nowrap px-3 py-2 font-medium text-govbr-blue">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      #{row.gitlab_iid}
                    </a>
                  ) : (
                    (row.gitlab_iid ?? "—")
                  )}
                </td>
                <td className={TITULO_CELL}>
                  <span className="line-clamp-3">{row.titulo ?? "—"}</span>
                </td>
                <td className={COMPACT_CELL}>{formatParceriasText(row.modulo)}</td>
                <td className={COMPACT_CELL}>{formatParceriasText(row.tipo)}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueEstadoBadge row={row} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueStatusBadge row={row} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {formatParceriasText(row.prioridade)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {formatParceriasDate(row.criado_em)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {formatParceriasDate(row.entrega_prevista)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {formatParceriasDate(row.fechado_em)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
