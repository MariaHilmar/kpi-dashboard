import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { IssuesPagination } from "@/components/issues/IssuesPagination";
import { IssuesTable } from "@/components/issues/IssuesTable";
import { IssuesToolbar } from "@/components/issues/IssuesToolbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import { parseFilters } from "@/lib/dashboard/filters";
import { parseIssuesListParams } from "@/lib/dashboard/issues-page-params";
import { parseIssuesTableColumns } from "@/lib/dashboard/issues-table-columns";
import { searchIssues } from "@/lib/dashboard/issues";
import type { DashboardPageProps } from "@/lib/dashboard/page";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function recordFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    }
  }
  return params;
}

export default async function IssuesPage({ searchParams }: DashboardPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const sp = await searchParams;
  const filters = parseFilters(sp);
  const { page, list } = parseIssuesListParams(recordFromSearchParams(sp));
  const visibleColumns = parseIssuesTableColumns(sp.cols?.toString() ?? null);

  const [filterOptions, result] = await Promise.all([
    fetchFilterOptions(),
    searchIssues(filters, { ...list, page, pageSize: list.pageSize }),
  ]);

  const exportParams = recordFromSearchParams(sp);
  exportParams.delete("page");
  const exportQuery = exportParams.toString();
  const exportHref = exportQuery ? `/api/issues/export?${exportQuery}` : "/api/issues/export";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Issues"
        subtitle="Busca livre por título, autor, responsável ou ID — respeitando os filtros globais."
      />

      <IssuesToolbar
        autores={filterOptions.autores}
        statuses={filterOptions.statuses}
        exportHref={exportHref}
      />

      <IssuesTable rows={result.rows} visibleColumns={visibleColumns} />

      <IssuesPagination page={result.page} pageSize={result.pageSize} total={result.total} />
    </div>
  );
}
