import { ParceriasTable } from "@/components/parcerias/ParceriasTable";
import { ParceriasToolbar } from "@/components/parcerias/ParceriasToolbar";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import {
  buildParceriasExportHref,
  formatParceriaLabel,
  formatParceriasPeriodLabel,
  parseParceriasParams,
  parceriasShowParceriaColumn,
} from "@/lib/dashboard/parcerias-config";
import { fetchParceriasIssues } from "@/lib/dashboard/parcerias";
import type { DashboardPageProps } from "@/lib/dashboard/page";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ParceriasPage({ searchParams }: Readonly<DashboardPageProps>) {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const sp = await searchParams;
  const filterOptions = await fetchFilterOptions();
  const params = parseParceriasParams(sp, filterOptions.parcerias);
  const { rows, total } = await fetchParceriasIssues(params);
  const exportHref = buildParceriasExportHref(params);
  const periodoLabel = formatParceriasPeriodLabel(params.fechadoDe, params.fechadoAte);
  const showParceriaColumn = parceriasShowParceriaColumn(params.parceiro);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parcerias"
        subtitle={`Demandas com label Parceria:: no GitLab — fechamento de ${periodoLabel}.`}
      />

      <ParceriasToolbar parcerias={filterOptions.parcerias} exportHref={exportHref} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <strong>{formatParceriaLabel(params.parceiro)}</strong> — {total} demanda(s) no período
        </p>
      </div>

      <ParceriasTable rows={rows} showParceriaColumn={showParceriaColumn} />
    </div>
  );
}
