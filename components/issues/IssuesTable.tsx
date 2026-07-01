import { gitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import { isIssueOpen, issueEstadoLabel } from "@/lib/dashboard/issue-state";
import type { IssueRow } from "@/lib/dashboard/issues";
import { formatDate, formatNumber } from "@/lib/format";

import { IssuesSortableTh } from "./IssuesSortableTh";

type Props = {
  rows: IssueRow[];
};

function EstadoBadge({ estado }: { estado: string | null }) {
  const open = isIssueOpen(estado);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        open ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {issueEstadoLabel(estado)}
    </span>
  );
}

export function IssuesTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nenhuma issue encontrada para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Lista de issues filtradas, com módulo, tipo, estado e prazos</caption>
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <IssuesSortableTh columnKey="id" label="ID" />
            <IssuesSortableTh columnKey="titulo" label="Título" />
            <IssuesSortableTh columnKey="modulo" label="Módulo" />
            <IssuesSortableTh columnKey="tipo" label="Tipo" />
            <IssuesSortableTh columnKey="estado" label="Estado" />
            <IssuesSortableTh columnKey="prioridade" label="Prioridade" />
            <IssuesSortableTh columnKey="equipe" label="Equipe" />
            <th scope="col" className="px-3 py-2 font-medium">
              Parceria
            </th>
            <IssuesSortableTh columnKey="criado" label="Criado" />
            <th scope="col" className="px-3 py-2 font-medium">
              Data de Fechamento
            </th>
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
                <td className="max-w-md px-3 py-2 text-slate-900">
                  <span className="line-clamp-2">{row.titulo ?? "—"}</span>
                  {row.sla_mais_90_dias ? (
                    <span className="ml-1 inline-flex rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                      SLA &gt; 90d
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.modulo ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.tipo ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <EstadoBadge estado={row.estado} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.prioridade ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.equipe ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.parceria ?? "—"}</td>
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
