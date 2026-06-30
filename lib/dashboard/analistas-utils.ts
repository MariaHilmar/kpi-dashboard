import { TODOS } from "@/lib/dashboard/constants";

/** Utilitários puros (sem Supabase) — seguros para Client Components. */

export function normalizeAnoMes(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return currentAnoMes();

  if (/^\d{4}-\d{2}$/.test(raw)) {
    return raw.replace("-", "/");
  }

  if (/^\d{4}\/\d{2}$/.test(raw)) {
    return raw;
  }

  return currentAnoMes();
}

export function formatAnoMesLabel(anoMes: string): string {
  const normalized = normalizeAnoMes(anoMes);
  const [year, month] = normalized.split("/");
  return `${month}/${year}`;
}

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

/** Rótulo de período para relatórios formais: "Junho/2026". */
export function formatAnoMesPeriodoLabel(anoMes: string): string {
  const normalized = normalizeAnoMes(anoMes);
  const [year, monthStr] = normalized.split("/");
  const monthIndex = Number(monthStr) - 1;
  const monthName = MESES_PT[monthIndex] ?? monthStr;
  return `${monthName}/${year}`;
}

export function currentAnoMes(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function listRecentAnoMesOptions(count = 18): string[] {
  const options: string[] = [];
  const now = new Date();
  let year = now.getFullYear();
  // Usa aritmética de mês/ano — evita duplicatas quando o dia é 29–31 e setMonth() estoura.
  let month = now.getMonth() + 1;

  for (let index = 0; index < count; index += 1) {
    options.push(`${year}/${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return options;
}

export function normalizeSprintParam(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw || raw === TODOS) return "";
  return raw;
}

/** Valor do filtro Autor(a) na URL: explícito na query ou fallback do perfil logado. */
export function resolveAutorQueryParam(
  param: string | null | undefined,
  ownAutor: string | null | undefined,
): string {
  const raw = (param ?? "").trim();
  if (raw) return raw;
  const own = ownAutor?.trim();
  return own || TODOS;
}

/** Autor enviado à RPC: null quando "Todos". */
export function autorForSnapshot(autorParam: string): string | null {
  if (!autorParam || autorParam === TODOS) return null;
  return autorParam;
}

export function buildAnalistaExportFilename(analystName: string, anoMes: string): string {
  const safeName = analystName.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, " ");
  const safeAnoMes = formatAnoMesLabel(anoMes).replace("/", "-");
  return `Relatorio Atividades ${safeName} ${safeAnoMes}.xlsx`;
}

export function buildAnalistaWordExportFilename(analystName: string, anoMes: string): string {
  const safeName = analystName.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, " ");
  const safeAnoMes = formatAnoMesLabel(anoMes).replace("/", "-");
  return `Relatorio Atividades ${safeName} ${safeAnoMes}.docx`;
}
