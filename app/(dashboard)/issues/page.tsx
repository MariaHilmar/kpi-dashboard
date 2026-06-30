import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { IssuesPagination } from "@/components/issues/IssuesPagination";
import { IssuesTable } from "@/components/issues/IssuesTable";
import { IssuesToolbar } from "@/components/issues/IssuesToolbar";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  type IssueEstado,
  type IssueSla,
  ISSUES_PAGE_SIZE,
  TODOS,
} from "@/lib/dashboard/constants";
import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import { parseFilters } from "@/lib/dashboard/filters";
import { DEFAULT_ISSUE_ORDER } from "@/lib/dashboard/issueOrders";
import { searchIssues } from "@/lib/dashboard/issues";
import type { DashboardPageProps } from "@/lib/dashboard/page";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function str(value: string | string[] | undefined, fallback: string): string {
  return typeof value === "string" && value !== "" ? value : fallback;
}

function dateOr(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value === "") return null;
  return value;
}

export default async function IssuesPage({ searchParams }: DashboardPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const sp = await searchParams;
  const filters = parseFilters(sp);

  const pageRaw = Number(str(sp.page, "1"));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const estadoRaw = str(sp.estado, TODOS);
  const estado = (
    [TODOS, "open", "closed"].includes(estadoRaw) ? estadoRaw : TODOS
  ) as IssueEstado;

  const slaRaw = str(sp.sla, TODOS);
  const sla = (slaRaw === "acima_90" ? "acima_90" : TODOS) as IssueSla;

  const autorRaw = str(sp.autor, TODOS);
  const autor = autorRaw;

  const [filterOptions, result] = await Promise.all([
    fetchFilterOptions(),
    searchIssues(filters, {
      search: str(sp.q, ""),
      estado,
      sla,
      autor,
      criadoDe: dateOr(sp.criadoDe),
      criadoAte: dateOr(sp.criadoAte),
      order: str(sp.order, DEFAULT_ISSUE_ORDER),
      page,
      pageSize: ISSUES_PAGE_SIZE,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Issues"
        subtitle="Busca livre por título, autor, responsável ou ID — respeitando os filtros globais."
      />

      <IssuesToolbar autores={filterOptions.autores} />

      <IssuesTable rows={result.rows} />

      <IssuesPagination page={result.page} pageSize={result.pageSize} total={result.total} />
    </div>
  );
}
