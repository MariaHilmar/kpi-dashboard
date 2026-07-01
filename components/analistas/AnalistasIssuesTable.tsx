import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import { formatNumber } from "@/lib/format";
import type { AnalistaIssueRow } from "@/types/analistas";

type Props = {
  rows: AnalistaIssueRow[];
};

export function AnalistasIssuesTable({ rows }: Props) {
  const abertas = rows.filter((row) => row.status === "Aberta").length;
  const fechadas = rows.filter((row) => row.status === "Fechada").length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Lista de Issues — Aberto × Concluído</h2>
        <p className="mt-1 text-xs text-slate-500">
          Total Abertas: {formatNumber(abertas)} | Total Fechadas: {formatNumber(fechadas)} | Total:{" "}
          {formatNumber(rows.length)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Issue</th>
              <th scope="col" className="px-3 py-2 font-medium">Título</th>
              <th scope="col" className="px-3 py-2 font-medium">Módulo</th>
              <th scope="col" className="px-3 py-2 font-medium">Colaborador</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="px-3 py-2 font-medium">Status Label</th>
              <th scope="col" className="px-3 py-2 font-medium">Parceiro</th>
              <th scope="col" className="px-3 py-2 font-medium">Sprint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                  Nenhuma issue encontrada para o período selecionado.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const issueUrl = resolveGitlabWorkItemUrl({
                  gitlabRepo: row.gitlab_repo,
                  gitlabIid: row.gitlab_iid,
                  url: row.url,
                });
                const issueLabel = row.gitlab_iid != null ? `#${row.gitlab_iid}` : "—";

                return (
                <tr
                  key={`${row.gitlab_repo ?? "na"}-${row.gitlab_iid ?? "na"}-${row.criado_em ?? "na"}-${index}`}
                  className="hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                    {issueUrl ? (
                      <a
                        href={issueUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-govbr-blue hover:underline"
                      >
                        {issueLabel}
                      </a>
                    ) : (
                      issueLabel
                    )}
                  </td>
                  <td className="max-w-md px-3 py-2 text-slate-900">{row.titulo ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.modulo ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.colaborador ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.status ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.status_label ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.parceiro ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.sprint ?? "—"}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
