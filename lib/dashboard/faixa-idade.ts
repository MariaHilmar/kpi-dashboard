/**
 * Normalização da tabela de faixas de idade (Alertas).
 * Garante ordem fixa, preserva faixas legadas da RPC e recalcula percentuais.
 */

import { FAIXAS_IDADE_ABERTAS } from "@/lib/dashboard/constants";
import type { FaixaIdade } from "@/types/database";

const FAIXA_ALIASES: Record<string, string> = {
  "Mais de um ano": "Mais de 1 ano",
};

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeFaixaIdadeRows(rows: FaixaIdade[]): FaixaIdade[] {
  const aggregated = new Map<string, number>();

  for (const row of rows) {
    const faixa = FAIXA_ALIASES[row.faixa] ?? row.faixa;
    aggregated.set(faixa, (aggregated.get(faixa) ?? 0) + row.qtde);
  }

  const canonical = new Set<string>(FAIXAS_IDADE_ABERTAS);
  const ordered: FaixaIdade[] = FAIXAS_IDADE_ABERTAS.map((faixa) => ({
    faixa,
    qtde: aggregated.get(faixa) ?? 0,
    percentual: 0,
  }));

  for (const [faixa, qtde] of aggregated) {
    if (faixa === "Sem dado") continue;
    if (canonical.has(faixa)) continue;
    ordered.push({ faixa, qtde, percentual: 0 });
  }

  const semDado = aggregated.get("Sem dado");
  if (semDado !== undefined) {
    ordered.push({ faixa: "Sem dado", qtde: semDado, percentual: 0 });
  }

  const total = ordered.reduce((sum, row) => sum + row.qtde, 0);
  return ordered.map((row) => ({
    ...row,
    percentual: total > 0 ? roundPercent((row.qtde / total) * 100) : 0,
  }));
}
