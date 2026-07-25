"use client";

import { useEffect } from "react";

/** Dispara a caixa de impressão do navegador ao abrir a página. */
export function AutoPrint() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
