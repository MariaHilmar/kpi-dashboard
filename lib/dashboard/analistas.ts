import { normalizeAnoMes, normalizeSprintParam } from "@/lib/dashboard/analistas-utils";
import { TODOS } from "@/lib/dashboard/constants";
import { resolveGitlabWorkItemUrl } from "@/lib/dashboard/gitlab-url";
import { createServerSupabase } from "@/lib/supabase/server";

export {
  autorForSnapshot,
  buildAnalistaExportFilename,
  currentAnoMes,
  formatAnoMesLabel,
  listRecentAnoMesOptions,
  normalizeAnoMes,
  normalizeSprintParam,
  resolveAutorQueryParam,
} from "@/lib/dashboard/analistas-utils";
import type {
  AnalistaDistribuicaoRow,
  AnalistaIssueRow,
  AnalistaRelatorioKpis,
  AnalistaRelatorioSalvo,
  AnalistaRelatorioSnapshot,
  AnalistaRelatorioStatus,
  SaveAnalistaRelatorioInput,
} from "@/types/analistas";

const EMPTY_KPIS: AnalistaRelatorioKpis = {
  total: 0,
  abertas: 0,
  fechadas: 0,
  canceladas: 0,
  entregues: 0,
  doing: 0,
  sprint_atual: null,
};

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function mapDistribuicao(rows: unknown): AnalistaDistribuicaoRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      label: str(item.label) ?? "—",
      total: num(item.total),
      abertas: num(item.abertas),
      fechadas: num(item.fechadas),
      pct_conclusao: num(item.pct_conclusao),
    };
  });
}

function mapIssues(rows: unknown): AnalistaIssueRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    const gitlabIid =
      item.gitlab_iid === null || item.gitlab_iid === undefined ? null : num(item.gitlab_iid);
    const gitlabRepo = str(item.gitlab_repo);

    return {
      gitlab_iid: gitlabIid,
      gitlab_repo: gitlabRepo,
      titulo: str(item.titulo),
      modulo: str(item.modulo),
      tipo: str(item.tipo),
      colaborador: str(item.colaborador),
      status: str(item.status),
      status_label: str(item.status_label),
      parceiro: str(item.parceiro),
      epico: str(item.epico),
      sprint: str(item.sprint),
      criado_em: str(item.criado_em),
      url: resolveGitlabWorkItemUrl({
        gitlabRepo,
        gitlabIid,
        url: str(item.url),
      }),
    };
  });
}

function mapSnapshot(payload: unknown): AnalistaRelatorioSnapshot {
  const data = (payload ?? {}) as Record<string, unknown>;
  const kpis = (data.kpis ?? {}) as Record<string, unknown>;

  return {
    kpis: {
      total: num(kpis.total),
      abertas: num(kpis.abertas),
      fechadas: num(kpis.fechadas),
      canceladas: num(kpis.canceladas),
      entregues: num(kpis.entregues),
      doing: num(kpis.doing),
      sprint_atual: str(kpis.sprint_atual),
    },
    por_tipo: mapDistribuicao(data.por_tipo),
    por_modulo: mapDistribuicao(data.por_modulo),
    por_parceiro: mapDistribuicao(data.por_parceiro),
    issues: mapIssues(data.issues),
  };
}

export async function fetchAnalistaRelatorioSnapshot(params: {
  anoMes: string;
  sprint?: string;
  modulo?: string;
  /** Filtro legado por issues.autor (nome). */
  autor?: string | null;
  /** Filtro preferencial por GitLab user id. */
  gitlabUserId?: number | null;
}): Promise<AnalistaRelatorioSnapshot> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { kpis: EMPTY_KPIS, por_tipo: [], por_modulo: [], por_parceiro: [], issues: [] };
  }

  const { data, error } = await supabase.rpc("analista_relatorio_snapshot", {
    p_ano_mes: normalizeAnoMes(params.anoMes),
    p_sprint: normalizeSprintParam(params.sprint) || null,
    p_modulo: params.modulo && params.modulo !== TODOS ? params.modulo : null,
    p_autor: params.gitlabUserId ? null : params.autor?.trim() || null,
    p_gitlab_user_id: params.gitlabUserId ?? null,
  });

  if (error) {
    console.error("analista_relatorio_snapshot", error.message);
    return { kpis: EMPTY_KPIS, por_tipo: [], por_modulo: [], por_parceiro: [], issues: [] };
  }

  return mapSnapshot(data);
}

export async function fetchAnalistaRelatorioSalvo(params: {
  userId: string;
  anoMes: string;
  sprint?: string;
}): Promise<AnalistaRelatorioSalvo | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analista_relatorios")
    .select("id, user_id, ano_mes, sprint, outras_atividades, status, publicado_em, updated_at")
    .eq("user_id", params.userId)
    .eq("ano_mes", normalizeAnoMes(params.anoMes))
    .eq("sprint", normalizeSprintParam(params.sprint))
    .maybeSingle();

  if (error) {
    console.error("fetchAnalistaRelatorioSalvo", error.message);
    return null;
  }

  return (data ?? null) as AnalistaRelatorioSalvo | null;
}

export async function saveAnalistaRelatorio(
  userId: string,
  input: SaveAnalistaRelatorioInput,
): Promise<{ ok: true; relatorio: AnalistaRelatorioSalvo } | { ok: false; error: string }> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const anoMes = normalizeAnoMes(input.anoMes);
  const sprint = normalizeSprintParam(input.sprint);
  const status: AnalistaRelatorioStatus = input.status ?? "rascunho";

  const { data, error } = await supabase
    .from("analista_relatorios")
    .upsert(
      {
        user_id: userId,
        ano_mes: anoMes,
        sprint,
        outras_atividades: input.outrasAtividades.trim() || null,
        status,
      },
      { onConflict: "user_id,ano_mes,sprint" },
    )
    .select("id, user_id, ano_mes, sprint, outras_atividades, status, publicado_em, updated_at")
    .single();

  if (error || !data) {
    console.error("saveAnalistaRelatorio", error?.message);
    return { ok: false, error: "Não foi possível salvar o relatório." };
  }

  return { ok: true, relatorio: data as AnalistaRelatorioSalvo };
}
