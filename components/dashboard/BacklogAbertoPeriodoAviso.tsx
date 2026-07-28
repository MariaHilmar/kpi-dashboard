import { DEFAULT_PERIODO_TIPO } from "@/lib/dashboard/constants";
import { periodoExcluiAbertas } from "@/lib/dashboard/period-filter";
import type { DashboardFilters } from "@/types/database";

const TIPO_PALAVRA: Record<string, string> = {
  fechamento: "fechamento",
  merge: "merge",
};

type Props = {
  filters: DashboardFilters;
};

/**
 * Aviso para os painéis de backlog aberto: quando o período global filtra por
 * fechamento ou merge, as issues abertas ficam de fora e os painéis aparecem
 * vazios. Orienta o usuário a trocar o período para "data de criação".
 */
export function BacklogAbertoPeriodoAviso({ filters }: Props) {
  if (!periodoExcluiAbertas(filters)) return null;

  const tipo = filters.periodoTipo ?? DEFAULT_PERIODO_TIPO;
  const palavra = TIPO_PALAVRA[tipo] ?? "fechamento";

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="mt-0.5 h-5 w-5 shrink-0 fill-amber-500"
      >
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v4a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1 1 0 100 2 1 1 0 000-2z"
          clipRule="evenodd"
        />
      </svg>
      <p>
        O período está filtrado por <strong>data de {palavra}</strong>, e issues abertas não têm
        essa data — por isso os painéis de <strong>backlog aberto</strong> podem aparecer vazios.
        Para vê-los, troque o período para <strong>data de criação</strong> ou selecione{" "}
        <strong>Todos</strong>.
      </p>
    </div>
  );
}
