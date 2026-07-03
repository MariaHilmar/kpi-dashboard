import { Suspense } from "react";
import { redirect } from "next/navigation";

import { MilestoneSelector } from "@/components/dashboard/milestone/MilestoneSelector";
import { MilestoneThroughputSection } from "@/components/dashboard/milestone/MilestoneThroughputSection";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { parseFlowGranularity } from "@/lib/dashboard/flow-report-params";
import { fetchMilestoneDetail } from "@/lib/dashboard/milestone-report";
import { listMilestoneOptions } from "@/lib/dashboard/milestones";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function parseMilestoneIid(raw: string | string[] | undefined): number | null {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
  if (!value) return null;
  const iid = Number(value);
  return Number.isInteger(iid) && iid > 0 ? iid : null;
}

function MilestoneThroughputSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
      <div className="h-72 rounded-lg bg-slate-100" />
    </div>
  );
}

export default async function MilestonePage({ searchParams }: DashboardPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const { configured } = await getDashboardContext(searchParams);
  if (!configured) {
    return <SetupBanner />;
  }

  const rawParams = await searchParams;
  const milestones = await listMilestoneOptions();
  let milestoneIid = parseMilestoneIid(rawParams.iid);

  if (milestoneIid == null && milestones.length > 0) {
    const latest = milestones[0]?.gitlab_milestone_iid;
    if (latest != null) {
      redirect(`/milestone?iid=${latest}`);
    }
  }

  const granularity = parseFlowGranularity(
    typeof rawParams.granularity === "string" ? rawParams.granularity : null,
  );

  const milestone = milestoneIid != null ? await fetchMilestoneDetail(milestoneIid) : null;

  const pageTitle =
    milestone != null
      ? `Sprint ${milestone.gitlab_milestone_iid} — ${milestone.titulo}`
      : "Relatório Milestone";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={pageTitle}
        subtitle="Throughput intra-sprint reutilizando o motor de /fluxo, recortado pela janela da milestone."
      />

      <MilestoneSelector milestones={milestones} selectedIid={milestoneIid} />

      {milestoneIid == null ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Selecione uma sprint ou importe milestones do GitLab em Importar Dados.
        </div>
      ) : milestone == null ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Milestone {milestoneIid} não encontrada. Sincronize ou importe os dados da sprint.
        </div>
      ) : !milestone.start_date || !milestone.due_date ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A milestone não possui start_date e due_date definidos. Throughput intra-sprint requer
          ambas as datas.
        </div>
      ) : (
        <Suspense fallback={<MilestoneThroughputSkeleton />}>
          <MilestoneThroughputSection milestone={milestone} granularity={granularity} />
        </Suspense>
      )}
    </div>
  );
}
