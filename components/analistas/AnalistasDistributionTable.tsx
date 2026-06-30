import type { AnalistaDistribuicaoRow } from "@/types/analistas";
import { formatNumber } from "@/lib/format";

type Props = {
  title: string;
  rows: AnalistaDistribuicaoRow[];
};

export function AnalistasDistributionTable({ title, rows }: Props) {
  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      abertas: acc.abertas + row.abertas,
      fechadas: acc.fechadas + row.fechadas,
    }),
    { total: 0, abertas: 0, fechadas: 0 },
  );

  const pctTotal =
    totals.total > 0 ? Math.round((totals.fechadas / totals.total) * 100) : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Item</th>
              <th scope="col" className="px-4 py-2 font-medium">Total</th>
              <th scope="col" className="px-4 py-2 font-medium">Abertas</th>
              <th scope="col" className="px-4 py-2 font-medium">Fechadas</th>
              <th scope="col" className="px-4 py-2 font-medium">% Conclusão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Nenhum dado para o recorte selecionado.
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-2 text-slate-900">{row.label}</td>
                    <td className="px-4 py-2 text-slate-600">{formatNumber(row.total)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatNumber(row.abertas)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatNumber(row.fechadas)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatNumber(row.pct_conclusao)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-medium">
                  <td className="px-4 py-2 text-slate-900">TOTAL</td>
                  <td className="px-4 py-2">{formatNumber(totals.total)}</td>
                  <td className="px-4 py-2">{formatNumber(totals.abertas)}</td>
                  <td className="px-4 py-2">{formatNumber(totals.fechadas)}</td>
                  <td className="px-4 py-2">{formatNumber(pctTotal)}%</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
