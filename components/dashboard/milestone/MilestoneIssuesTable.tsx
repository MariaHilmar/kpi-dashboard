import { StoryPointsBadge } from "@/components/issues/StoryPointsBadge";
import { IssueEstadoBadge } from "@/components/issues/IssueEstadoBadge";
import { IssueStatusBadge } from "@/components/issues/IssueStatusBadge";
import { gitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import type { MilestoneIssueRow } from "@/lib/dashboard/milestone-report";

const TITULO_COLUMN = "w-[19.6rem] max-w-[19.6rem]";
const COMMENT_COLUMN = "w-[16rem] max-w-[16rem]";

type Props = {
  rows: MilestoneIssueRow[];
};

export function MilestoneIssuesTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nenhuma issue no snapshot desta milestone para os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
        <caption className="sr-only">
          Issues da milestone — peso, status, responsável, comentário e homologação
        </caption>
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2">
              Issue
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Peso
            </th>
            <th scope="col" className="px-3 py-2">
              Status
            </th>
            <th scope="col" className="px-3 py-2">
              Responsável
            </th>
            <th scope="col" className={`px-3 py-2 ${COMMENT_COLUMN}`}>
              Comentário
            </th>
            <th scope="col" className="px-3 py-2">
              Homologado?
            </th>
            <th scope="col" className="px-3 py-2">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const issueUrl = gitlabWorkItemUrl(row.gitlab_repo, row.gitlab_iid);
            const badgeRow = {
              estado: row.estado,
              status: row.status,
            };

            return (
              <tr key={row.issue_key} className="hover:bg-slate-50">
                <td className={`px-3 py-2 ${TITULO_COLUMN}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-slate-500">
                      {issueUrl ? (
                        <a
                          href={issueUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-govbr-blue hover:underline"
                        >
                          #{row.gitlab_iid}
                        </a>
                      ) : (
                        `#${row.gitlab_iid}`
                      )}
                    </span>
                    <span className="line-clamp-2 text-slate-900">{row.titulo ?? "—"}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <StoryPointsBadge value={row.story_points} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueStatusBadge row={badgeRow} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.assignee ?? "—"}</td>
                <td className={`px-3 py-2 text-slate-600 ${COMMENT_COLUMN}`}>
                  <span className="line-clamp-3 text-xs leading-snug">
                    {row.ultimo_comentario ?? "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.homologado ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <IssueEstadoBadge row={badgeRow} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
