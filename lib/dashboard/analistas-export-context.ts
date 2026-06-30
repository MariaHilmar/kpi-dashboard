import {
  findProfileByAutor,
  getProfile,
  isCurrentUserAdmin,
  resolveAnalistaIssueFilter,
  resolveAutorFiltro,
} from "@/lib/auth/profile";
import {
  autorForSnapshot,
  resolveAutorQueryParam,
} from "@/lib/dashboard/analistas-utils";
import {
  fetchAnalistaRelatorioSalvo,
  fetchAnalistaRelatorioSnapshot,
  normalizeAnoMes,
  normalizeSprintParam,
} from "@/lib/dashboard/analistas";
import { TODOS } from "@/lib/dashboard/constants";
import type { AnalistaRelatorioSalvo, AnalistaRelatorioSnapshot } from "@/types/analistas";

export type AnalistaExportContext = {
  analystName: string;
  anoMes: string;
  sprint: string;
  sprintParam: string;
  modulo: string;
  snapshot: AnalistaRelatorioSnapshot;
  outrasAtividades: string | null;
};

export async function resolveAnalistaExportContext(params: {
  userId: string;
  anoMesRaw: string | null;
  sprintParam: string;
  modulo: string;
  autorParam: string | null;
  requestedUserId: string | null;
}): Promise<
  { ok: true; data: AnalistaExportContext } | { ok: false; status: number; message: string }
> {
  const anoMes = normalizeAnoMes(params.anoMesRaw);
  const sprint = normalizeSprintParam(params.sprintParam);

  const ownProfile = await getProfile(params.userId);
  const ownAutor = resolveAutorFiltro(ownProfile);
  const resolvedAutorParam = resolveAutorQueryParam(params.autorParam, ownAutor);
  const autorFiltro = autorForSnapshot(resolvedAutorParam);

  let targetUserId = params.userId;
  let analystName =
    ownProfile?.full_name ?? ownProfile?.email?.split("@")[0] ?? "Analista";
  let issueFilter = { gitlabUserId: null as number | null, autor: autorFiltro };

  if (params.requestedUserId && params.requestedUserId !== params.userId) {
    const admin = await isCurrentUserAdmin();
    if (!admin) {
      return {
        ok: false,
        status: 403,
        message: "Apenas administradores podem exportar relatórios de outros analistas.",
      };
    }
    targetUserId = params.requestedUserId;
    const targetProfile = await getProfile(targetUserId);
    analystName =
      targetProfile?.full_name ?? targetProfile?.email?.split("@")[0] ?? analystName;
    issueFilter =
      resolvedAutorParam === TODOS
        ? { gitlabUserId: null, autor: null }
        : resolveAnalistaIssueFilter(targetProfile).gitlabUserId
          ? resolveAnalistaIssueFilter(targetProfile)
          : { gitlabUserId: null, autor: autorFiltro };
  } else if (resolvedAutorParam !== TODOS) {
    analystName = resolvedAutorParam;
    const matchedProfile = await findProfileByAutor(resolvedAutorParam);
    if (matchedProfile) {
      targetUserId = matchedProfile.id;
      analystName = matchedProfile.full_name ?? matchedProfile.email.split("@")[0] ?? analystName;
      issueFilter = resolveAnalistaIssueFilter(matchedProfile).gitlabUserId
        ? resolveAnalistaIssueFilter(matchedProfile)
        : { gitlabUserId: null, autor: autorFiltro };
    }
  }

  const [snapshot, relatorioSalvo] = await Promise.all([
    fetchAnalistaRelatorioSnapshot({
      anoMes,
      sprint: params.sprintParam,
      modulo: params.modulo,
      autor: issueFilter.autor,
      gitlabUserId: issueFilter.gitlabUserId,
    }),
    fetchAnalistaRelatorioSalvo({ userId: targetUserId, anoMes, sprint }),
  ]);

  return {
    ok: true,
    data: {
      analystName,
      anoMes,
      sprint,
      sprintParam: params.sprintParam,
      modulo: params.modulo,
      snapshot,
      outrasAtividades: (relatorioSalvo as AnalistaRelatorioSalvo | null)?.outras_atividades ?? null,
    },
  };
}
