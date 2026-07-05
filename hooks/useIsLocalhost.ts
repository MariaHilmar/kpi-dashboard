"use client";

import { useEffect, useState } from "react";

import { isLocalhostOrigin } from "@/lib/navigation";

/** Detecta execução em http://localhost/ (ou 127.0.0.1), após hidratação no cliente. */
export function useIsLocalhost(): boolean {
  const [isLocalhost, setIsLocalhost] = useState(() =>
    isLocalhostOrigin(window.location.hostname)
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLocalhost(isLocalhostOrigin(window.location.hostname));
  }, []);

  return isLocalhost;
}
