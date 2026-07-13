import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";

import { PLANILHA_COLUNAS } from "@/components/dados/import/constants";

export function ImportPlanilhaColumns() {
  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faListCheck} className="text-blue-700" />
          <h2 className="text-base font-semibold text-slate-900">Colunas da planilha</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          O template já traz os cabeçalhos corretos. Você também pode usar nomes alternativos como{" "}
          <em>Repositório</em>, <em>ID</em> ou <em>Pontos</em>.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-2 font-medium">Coluna</th>
                <th className="pb-2 font-medium">Significado</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {PLANILHA_COLUNAS.map((item) => (
                <tr key={item.coluna} className="border-b border-slate-100 align-top">
                  <td className="py-2.5 pr-2">
                    <code className="text-xs text-blue-800">{item.coluna}</code>
                    {item.obrigatoria ? (
                      <span className="ml-1 text-[10px] font-semibold uppercase text-rose-600">
                        obrig.
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    <span className="block">{item.descricao}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">Ex.: {item.exemplo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </aside>
  );
}
