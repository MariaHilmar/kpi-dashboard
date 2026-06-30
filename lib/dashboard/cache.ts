import { unstable_cache } from "next/cache";

/**
 * Tag usada em todos os fetchers de KPI.
 * Invalide com revalidateTag(CACHE_TAG_KPIS) após cada sync do pipeline.
 */
export const CACHE_TAG_KPIS = "kpis";

/** TTL padrão: 24 h (dados só mudam após sync do pipeline). */
const CACHE_TTL_SECONDS = 86_400;

/**
 * Envolve uma função assíncrona com Next.js Data Cache.
 * Em produção (Vercel) o cache é persistido regionalmente.
 * Em dev local o cache tem escopo de processo (reinicia junto com `next dev`).
 */
export function cachedFetch<TArgs extends unknown[], TResult>(
  key: string,
  fn: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) =>
    unstable_cache(fn, [key, JSON.stringify(args)], {
      tags: [CACHE_TAG_KPIS],
      revalidate: CACHE_TTL_SECONDS,
    })(...args);
}
