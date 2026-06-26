import { parseFilters } from "@/lib/dashboard/filters";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/types/database";

/** searchParams cru recebido pelos route handlers do App Router. */
export type DashboardSearchParams = Record<string, string | string[] | undefined>;

/** Props padrão das páginas do dashboard (App Router, searchParams assíncrono). */
export type DashboardPageProps = {
  searchParams: Promise<DashboardSearchParams>;
};

export type DashboardContext = {
  /** Supabase está configurado via variáveis de ambiente. */
  configured: boolean;
  /** Filtros já normalizados a partir da URL. */
  filters: DashboardFilters;
};

/**
 * Resolve o contexto comum a toda página do dashboard: estado de configuração
 * do Supabase e os filtros normalizados da URL. Centraliza o boilerplate que
 * antes se repetia em cada página.
 */
export async function getDashboardContext(
  searchParams: DashboardPageProps["searchParams"],
): Promise<DashboardContext> {
  return {
    configured: isSupabaseConfigured(),
    filters: parseFilters(await searchParams),
  };
}
