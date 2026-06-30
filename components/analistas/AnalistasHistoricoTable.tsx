"use client";

import { Fragment, useState } from "react";

import type { AnalistaRelatorioComAutor } from "@/types/analistas";
import { formatAnoMesLabel } from "@/lib/dashboard/analistas-utils";

type Props = {
  rows: AnalistaRelatorioComAutor[];
};

function StatusBadge({ status }: { status: AnalistaRelatorioComAutor["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "publicado"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {status === "publicado" ? "Publicado" : "Rascunho"}
    </span>
  );
}

export function AnalistasHistoricoTable({ rows }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nenhum relatório encontrado para o filtro atual.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Analista</th>
            <th scope="col" className="px-3 py-2 font-medium">Mês</th>
            <th scope="col" className="px-3 py-2 font-medium">Sprint</th>
            <th scope="col" className="px-3 py-2 font-medium">Status</th>
            <th scope="col" className="px-3 py-2 font-medium">Publicado em</th>
            <th scope="col" className="px-3 py-2 font-medium">Atualizado em</th>
            <th scope="col" className="px-3 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const isExpanded = expandedId === row.id;
            const exportHref = `/api/analistas/export?${new URLSearchParams({
              anoMes: row.ano_mes,
              userId: row.user_id,
              ...(row.sprint ? { sprint: row.sprint } : {}),
            }).toString()}`;

            return (
              <Fragment key={row.id}>
                <tr className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-900">
                    <span className="block font-medium">{row.autor_nome}</span>
                    <span className="block text-xs text-slate-400">{row.autor_email}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {formatAnoMesLabel(row.ano_mes)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.sprint || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {row.publicado_em ? new Date(row.publicado_em).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {new Date(row.updated_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        className="text-xs font-medium text-govbr-blue hover:underline"
                      >
                        {isExpanded ? "Ocultar" : "Ver atividades"}
                      </button>
                      <a
                        href={exportHref}
                        className="text-xs font-medium text-govbr-blue hover:underline"
                      >
                        Exportar Excel
                      </a>
                    </div>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-3 py-3 text-sm text-slate-700">
                      <p className="whitespace-pre-wrap">
                        {row.outras_atividades?.trim() || "Nenhuma atividade adicional registrada."}
                      </p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
