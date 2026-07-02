import {
  type IssueEstado,
  type IssueSla,
  ISSUES_PAGE_SIZE,
  TODOS,
} from "@/lib/dashboard/constants";
import { resolveIssueListOrder } from "@/lib/dashboard/issue-list-sort";
import type { IssuesSearchParams } from "@/lib/dashboard/issues";

function str(value: string | null, fallback: string): string {
  return value && value !== "" ? value : fallback;
}

function dateOr(value: string | null): string | null {
  if (!value || value === "") return null;
  return value;
}

/** Parâmetros de listagem/export a partir da query string da página Issues. */
export function parseIssuesListParams(searchParams: URLSearchParams): {
  list: IssuesSearchParams;
  page: number;
} {
  const pageRaw = Number(str(searchParams.get("page"), "1"));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const estadoRaw = str(searchParams.get("estado"), TODOS);
  const estado = (
    [TODOS, "open", "closed"].includes(estadoRaw) ? estadoRaw : TODOS
  ) as IssueEstado;

  const slaRaw = str(searchParams.get("sla"), TODOS);
  const sla = (slaRaw === "acima_90" ? "acima_90" : TODOS) as IssueSla;

  const faixaIdadeRaw = searchParams.get("faixaIdade")?.trim() ?? "";
  const faixaIdade = faixaIdadeRaw || null;

  return {
    page,
    list: {
      search: str(searchParams.get("q"), ""),
      estado,
      sla,
      faixaIdade,
      autor: str(searchParams.get("autor"), TODOS),
      criadoDe: dateOr(searchParams.get("criadoDe")),
      criadoAte: dateOr(searchParams.get("criadoAte")),
      order: resolveIssueListOrder(searchParams.get("order")),
      page,
      pageSize: ISSUES_PAGE_SIZE,
    },
  };
}
