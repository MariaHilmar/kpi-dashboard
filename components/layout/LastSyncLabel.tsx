"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDateTime } from "@/lib/format";

type Props = {
  initialLastSync?: string | null;
  /** Prefixo do rótulo (ex.: "Dados atualizados em"). */
  prefix?: string;
  className?: string;
};

const REFRESH_MS = 60_000;

export function LastSyncLabel({
  initialLastSync = null,
  prefix = "Dados atualizados em",
  className,
}: Props) {
  const [lastSync, setLastSync] = useState<string | null>(initialLastSync);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/last-sync", { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { lastSync?: string | null };
      if (typeof body.lastSync === "string" || body.lastSync === null) {
        setLastSync(body.lastSync);
      }
    } catch {
      // Mantém o valor atual se a rede falhar.
    }
  }, []);

  useEffect(() => {
    setLastSync(initialLastSync);
  }, [initialLastSync]);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => {
      void refresh();
    }, REFRESH_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  if (!lastSync) return null;

  return (
    <p className={className} title="Última atualização dos dados no Supabase">
      {prefix} {formatDateTime(lastSync)}
    </p>
  );
}
