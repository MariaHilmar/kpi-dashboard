import type ExcelJS from "exceljs";

import { NAO_INFORMADO } from "@/lib/dashboard/constants";
import { issueEstadoLabel } from "@/lib/dashboard/issue-state";
import type { IssueRow } from "@/lib/dashboard/issues";

export type IssueStatusTone = {
  badgeClassName: string;
  excelFillArgb: string;
  excelFontArgb: string;
  chartHex: string;
};

type StatusToneDefinition = IssueStatusTone & {
  keys: string[];
};

/** Paleta Gov.br + fallbacks para status conhecidos do fluxo GitLab. */
const STATUS_TONE_DEFINITIONS: StatusToneDefinition[] = [
  {
    keys: ["backlog"],
    badgeClassName: "bg-slate-100 text-slate-700",
    excelFillArgb: "FFE2E8F0",
    excelFontArgb: "FF334155",
    chartHex: "#64748B",
  },
  {
    keys: ["doing", "em andamento"],
    badgeClassName: "bg-blue-100 text-blue-800",
    excelFillArgb: "FFDBEAFE",
    excelFontArgb: "FF1E40AF",
    chartHex: "#1351B4",
  },
  {
    keys: ["sprint atual"],
    badgeClassName: "bg-amber-100 text-amber-900",
    excelFillArgb: "FFFEF3C7",
    excelFontArgb: "FF92400E",
    chartHex: "#FFC107",
  },
  {
    keys: ["em revisao", "em revisão"],
    badgeClassName: "bg-violet-100 text-violet-800",
    excelFillArgb: "FFEDE9FE",
    excelFontArgb: "FF5B21B6",
    chartHex: "#7F3F98",
  },
  {
    keys: ["delivered", "concluida", "concluída", "done", "fechada"],
    badgeClassName: "bg-emerald-100 text-emerald-800",
    excelFillArgb: "FFD1FAE5",
    excelFontArgb: "FF065F46",
    chartHex: "#168821",
  },
  {
    keys: ["aberta"],
    badgeClassName: "bg-sky-100 text-sky-800",
    excelFillArgb: "FFE0F2FE",
    excelFontArgb: "FF075985",
    chartHex: "#407A9D",
  },
  {
    keys: ["nao informado", "não informado"],
    badgeClassName: "bg-slate-100 text-slate-600",
    excelFillArgb: "FFF1F5F9",
    excelFontArgb: "FF475569",
    chartHex: "#94A3B8",
  },
];

const FALLBACK_TONES: IssueStatusTone[] = [
  {
    badgeClassName: "bg-teal-100 text-teal-800",
    excelFillArgb: "FFCCFBF1",
    excelFontArgb: "FF115E59",
    chartHex: "#59B9DE",
  },
  {
    badgeClassName: "bg-orange-100 text-orange-800",
    excelFillArgb: "FFFFEDD5",
    excelFontArgb: "FF9A3412",
    chartHex: "#FF580A",
  },
  {
    badgeClassName: "bg-rose-100 text-rose-800",
    excelFillArgb: "FFFFE4E6",
    excelFontArgb: "FF9F1239",
    chartHex: "#E52207",
  },
  {
    badgeClassName: "bg-lime-100 text-lime-900",
    excelFillArgb: "FFECFCCB",
    excelFontArgb: "FF365314",
    chartHex: "#92894F",
  },
  {
    badgeClassName: "bg-indigo-100 text-indigo-800",
    excelFillArgb: "FFE0E7FF",
    excelFontArgb: "FF3730A3",
    chartHex: "#354657",
  },
];

const STATUS_TONE_LOOKUP = new Map<string, IssueStatusTone>();

for (const definition of STATUS_TONE_DEFINITIONS) {
  const { keys, ...tone } = definition;
  for (const key of keys) {
    STATUS_TONE_LOOKUP.set(normalizeStatusKey(key), tone);
  }
}

function normalizeStatusKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function hashLabel(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Rótulo exibido: label GitLab (`status::`) ou fallback Aberta/Fechada (agregações). */
export function resolveIssueStatusLabel(
  row: Pick<IssueRow, "status" | "estado">,
): string {
  const trimmed = row.status?.trim();
  if (trimmed) return trimmed;
  return issueEstadoLabel(row.estado);
}

/** Rótulo de workflow GitLab para colunas de listagem (sem duplicar Estado). */
export function resolveIssueWorkflowStatusLabel(row: Pick<IssueRow, "status">): string {
  return row.status?.trim() || "—";
}

export function getIssueStatusTone(label: string): IssueStatusTone {
  const normalized = normalizeStatusKey(label);
  const known = STATUS_TONE_LOOKUP.get(normalized);
  if (known) return known;

  if (!normalized) {
    return STATUS_TONE_LOOKUP.get(normalizeStatusKey(NAO_INFORMADO))!;
  }

  return FALLBACK_TONES[hashLabel(normalized) % FALLBACK_TONES.length];
}

export function getIssueStatusChartHex(label: string): string {
  return getIssueStatusTone(label).chartHex;
}

export function applyIssueStatusExcelStyle(cell: ExcelJS.Cell, label: string): void {
  const tone = getIssueStatusTone(label);
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: tone.excelFillArgb },
  };
  cell.font = {
    size: 10,
    bold: true,
    color: { argb: tone.excelFontArgb },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}
