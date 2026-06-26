import type { IssueRow } from "@/lib/dashboard/issues";
import { formatDate, formatNumber } from "@/lib/format";

type Props = {
  rows: IssueRow[];
};

function EstadoBadge({ estado }: { estado: string | null }) {
  const isOpen = estado === "open" || estado === "opened";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isOpen ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {isOpen ? "Aberta" : "Fechada"}
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
            <th scope="col" className="px-3 py-2 font-medium">ID</th>
            <th scope="col" className="px-3 py-2 font-medium">Título</th>
            <th scope="col" className="px-3 py-2 font-medium">Módulo</th>
            <th scope="col" className="px-3 py-2 font-medium">Tipo</th>
            <th scope="col" className="px-3 py-2 font-medium">Estado</th>
            <th scope="col" className="px-3 py-2 font-medium">Prioridade</th>
            <th scope="col" className="px-3 py-2 font-medium">Equipe</th>
            <th scope="col" className="px-3 py-2 font-medium">Criado</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Lead (d)</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Idade (d)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row.gitlab_repo}-${row.gitlab_iid}-${index}`} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                {row.gitlab_iid ?? "—"}
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
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(row.criado_em)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                {formatNumber(row.lead_time_dias)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                {formatNumber(row.idade_dias)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
