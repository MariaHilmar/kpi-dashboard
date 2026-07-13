"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export type MilestoneUrlPatch = Record<string, string | null>;

/**
 * Atualiza query params da página de milestone preservando os demais filtros.
 * Usado pelos painéis interativos (burndown, capacidade, roadmap, entrega).
 */
export function useMilestoneUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushParams = useCallback(
    (next: MilestoneUrlPatch) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  return { pushParams, isPending };
}
