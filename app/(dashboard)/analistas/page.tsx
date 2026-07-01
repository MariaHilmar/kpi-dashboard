import { Suspense } from "react";

import { AnalistasDistributionTable } from "@/components/analistas/AnalistasDistributionTable";
import { AnalistasFilters } from "@/components/analistas/AnalistasFilters";
import { AnalistasIssuesTable } from "@/components/analistas/AnalistasIssuesTable";
import { AnalistasKpiStrip } from "@/components/analistas/AnalistasKpiStrip";
import { OutrasAtividadesEditor } from "@/components/analistas/OutrasAtividadesEditor";
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  findProfileByAutor,
  getCurrentProfile,
  isCurrentUserAdmin,
  isSameAutor,
  resolveAnalistaIssueFilter,
  resolveAutorFiltro,
} from "@/lib/auth/profile";
import {
  autorForSnapshot,
  currentAnoMes,
  fetchAnalistaRelatorioSalvo,
  fetchAnalistaRelatorioSnapshot,
  formatAnoMesLabel,
  normalizeAnoMes,
  normalizeSprintParam,
  resolveAutorQueryParam,
} from "@/lib/dashboard/analistas";
import { TODOS } from "@/lib/dashboard/constants";
import { fetchFilterOptions } from "@/lib/dashboard/fetchers";
import type { DashboardPageProps } from "@/lib/dashboard/page";
import { getSessionUser } from "@/lib/supabase/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function str(value: string | string[] | undefined, fallback: string): string {
  return typeof value === "string" && value !== "" ? value : fallback;
}

function displayAutorLabel(autorParam: string): string {
  return autorParam === TODOS ? "Todos os autores" : autorParam;
}

export default async function AnalistasPage({ searchParams }: DashboardPageProps) {
  if (!isSupabaseConfigured()) {
    return <SetupBanner />;
  }

  const sp = await searchParams;
  const anoMes = normalizeAnoMes(str(sp.anoMes, currentAnoMes()));
  const sprintParam = str(sp.sprint, TODOS);
  const sprint = normalizeSprintParam(sprintParam);
  const modulo = str(sp.modulo, TODOS);

  const user = await getSessionUser();
  const profile = await getCurrentProfile();
  const ownAutor = resolveAutorFiltro(profile);
  const autorParam = resolveAutorQueryParam(
    typeof sp.autor === "string" ? sp.autor : undefined,
    ownAutor,
  );
  const autorFiltro = autorForSnapshot(autorParam);
  const targetProfile =
    autorParam !== TODOS ? await findProfileByAutor(autorParam) : null;
  const filterProfile =
    targetProfile ?? (isSameAutor(autorParam, ownAutor) ? profile : null);
  const issueFilter =
    autorParam === TODOS
      ? { gitlabUserId: null, autor: null }
      : resolveAnalistaIssueFilter(filterProfile).gitlabUserId
        ? resolveAnalistaIssueFilter(filterProfile)
        : { gitlabUserId: null, autor: autorFiltro };
  const canEditOutras = Boolean(user && ownAutor && isSameAutor(autorParam, ownAutor));
  const isAdmin = await isCurrentUserAdmin();

  const relatorioUserId =
    canEditOutras && user
      ? user.id
      : isAdmin && targetProfile
        ? targetProfile.id
        : null;

  const [filterOptions, snapshot, relatorioSalvo] = await Promise.all([
    fetchFilterOptions(),
    fetchAnalistaRelatorioSnapshot({
      anoMes,
      sprint: sprintParam,
      modulo,
      autor: issueFilter.autor,
      gitlabUserId: issueFilter.gitlabUserId,
    }),
    relatorioUserId
      ? fetchAnalistaRelatorioSalvo({ userId: relatorioUserId, anoMes, sprint })
      : Promise.resolve(null),
  ]);

  const exportParams = new URLSearchParams({ anoMes });
  if (sprintParam !== TODOS) exportParams.set("sprint", sprintParam);
  if (modulo !== TODOS) exportParams.set("modulo", modulo);
  if (autorParam !== TODOS) exportParams.set("autor", autorParam);
  if (isAdmin && targetProfile && !canEditOutras) {
    exportParams.set("userId", targetProfile.id);
  }
  const exportHref = `/api/analistas/export?${exportParams.toString()}`;
  const exportWordHref = `/api/analistas/export/word?${exportParams.toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`Atividades — ${displayAutorLabel(autorParam)} ${formatAnoMesLabel(anoMes)}`}
          subtitle="Selecione o autor(a) das issues, o mês e a sprint. Gestores visualizam qualquer analista; cada analista edita apenas suas outras atividades."
        />
        {user ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={exportWordHref}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Exportar Word
            </a>
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-lg bg-govbr-blue px-4 py-2 text-sm font-medium text-white hover:bg-govbr-blue-dark"
            >
              Exportar Excel
            </a>
          </div>
        ) : null}
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse rounded-xl bg-white" />}>
        <AnalistasFilters
          sprints={filterOptions.sprints}
          autores={filterOptions.autores}
          defaultAutor={autorParam}
        />
      </Suspense>

      {autorParam === TODOS ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Selecione um <strong>Autor(a)</strong> para ver o relatório mensal de uma analista
          específica. Com &quot;Todos os autores&quot;, o painel agrega issues de todo o time no
          período.
        </div>
      ) : null}

      <AnalistasKpiStrip kpis={snapshot.kpis} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalistasDistributionTable title="Distribuição por módulo" rows={snapshot.por_modulo} />
        <AnalistasDistributionTable title="Distribuição por parceiro" rows={snapshot.por_parceiro} />
      </div>

      <AnalistasIssuesTable rows={snapshot.issues} />

      {!user ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Faça login para salvar outras atividades.
        </div>
      ) : canEditOutras ? (
        <OutrasAtividadesEditor
          anoMes={anoMes}
          sprint={sprint}
          initialValue={relatorioSalvo?.outras_atividades ?? ""}
          initialStatus={relatorioSalvo?.status ?? "rascunho"}
          updatedAt={relatorioSalvo?.updated_at}
        />
      ) : relatorioSalvo ? (
        <OutrasAtividadesEditor
          anoMes={anoMes}
          sprint={sprint}
          initialValue={relatorioSalvo.outras_atividades ?? ""}
          initialStatus={relatorioSalvo.status}
          updatedAt={relatorioSalvo.updated_at}
          readOnly
        />
      ) : autorParam !== TODOS ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-medium text-slate-800">Outras atividades</p>
          <p className="mt-2">
            Você está visualizando o painel de <strong>{autorParam}</strong>. Apenas a analista
            selecionada pode editar o texto de outras atividades (administradores visualizam o
            conteúdo publicado nesta mesma página).
          </p>
        </div>
      ) : null}
    </div>
  );
}
