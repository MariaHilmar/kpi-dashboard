import { createRequire } from "node:module";

import type { AnalistaDistribuicaoRow } from "@/types/analistas";

const require = createRequire(import.meta.url);

const CHART_FONT_FAMILY = "DejaVu Sans";

const PIE_COLORS = [
  "#1351B4",
  "#168821",
  "#FFC107",
  "#E52207",
  "#7F3F98",
  "#407A9D",
  "#92894F",
  "#354657",
  "#59B9DE",
  "#FF580A",
];

function getChartFonts(): string[] {
  return [
    require.resolve("@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff2"),
    require.resolve("@fontsource/dejavu-sans/files/dejavu-sans-latin-700-normal.woff2"),
  ];
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/** Retorna apenas o atributo `d` de um `<path>` (nunca markup SVG). */
function describeSlicePath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 359.99) {
    const top = polarToCartesian(cx, cy, radius, 0);
    const bottom = polarToCartesian(cx, cy, radius, 180);
    return `M ${cx} ${cy} L ${top.x.toFixed(2)} ${top.y.toFixed(2)} A ${radius} ${radius} 0 1 1 ${bottom.x.toFixed(2)} ${bottom.y.toFixed(2)} A ${radius} ${radius} 0 1 1 ${top.x.toFixed(2)} ${top.y.toFixed(2)} Z`;
  }
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateLabel(label: string, max = 40): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

async function renderSvgToPng(svg: string): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: getChartFonts(),
      defaultFontFamily: CHART_FONT_FAMILY,
      serifFamily: CHART_FONT_FAMILY,
      sansSerifFamily: CHART_FONT_FAMILY,
      monospaceFamily: CHART_FONT_FAMILY,
      cursiveFamily: CHART_FONT_FAMILY,
      fantasyFamily: CHART_FONT_FAMILY,
    },
  });

  return Buffer.from(resvg.render().asPng());
}

/** Gera PNG de gráfico pizza + legenda para embutir no Word. */
export async function buildDistribuicaoPieChartPng(
  title: string,
  rows: AnalistaDistribuicaoRow[],
): Promise<Buffer> {
  const { svg } = buildDistribuicaoPieChartSvg(title, rows);
  return renderSvgToPng(svg);
}

export function getDistribuicaoPieChartHeight(rows: AnalistaDistribuicaoRow[]): number {
  const legendRows = rows.filter((row) => row.total > 0).length || 1;
  return Math.max(320, 56 + legendRows * 28);
}

function buildDistribuicaoPieChartSvg(
  title: string,
  rows: AnalistaDistribuicaoRow[],
): { svg: string; width: number; height: number } {
  const slices = rows.filter((row) => row.total > 0);
  const sum = slices.reduce((acc, row) => acc + row.total, 0);

  const width = 640;
  const legendRows = slices.length > 0 ? slices.length : 1;
  const height = Math.max(320, 56 + legendRows * 28);
  const cx = 150;
  const cy = Math.round(height / 2);
  const radius = Math.min(110, Math.round(height / 2) - 24);

  let angle = 0;
  const paths: string[] = [];
  const legend: string[] = [];

  slices.forEach((row, index) => {
    const pct = sum > 0 ? (row.total / sum) * 100 : 0;
    const sweep = sum > 0 ? (row.total / sum) * 360 : 0;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const end = angle + sweep;
    paths.push(
      `<path d="${describeSlicePath(cx, cy, radius, angle, end)}" fill="${color}" stroke="#ffffff" stroke-width="1.5" />`,
    );
    legend.push(`
      <rect x="320" y="${24 + index * 28}" width="14" height="14" fill="${color}" rx="2" />
      <text x="344" y="${35 + index * 28}" font-family="${CHART_FONT_FAMILY}, sans-serif" font-size="13" fill="#334155">
        ${escapeXml(truncateLabel(row.label))} (${row.total} · ${pct.toFixed(0)}%)
      </text>
    `);
    angle = end;
  });

  if (slices.length === 0) {
    paths.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#E2E8F0" />`);
    legend.push(`
      <text x="320" y="40" font-family="${CHART_FONT_FAMILY}, sans-serif" font-size="13" fill="#64748B">
        Sem dados para o recorte selecionado.
      </text>
    `);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="16" y="24" font-family="${CHART_FONT_FAMILY}, sans-serif" font-size="14" font-weight="700" fill="#0f172a">${escapeXml(title)}</text>
  ${paths.join("\n")}
  ${legend.join("\n")}
</svg>`;

  return { svg, width, height };
}

/** Fallback quando a RPC ainda não retorna por_tipo (pré-migration 013). */
export function aggregateDistribuicaoFromIssues(
  issues: { tipo?: string | null; modulo?: string | null; parceiro?: string | null }[],
  field: "tipo" | "modulo" | "parceiro",
): AnalistaDistribuicaoRow[] {
  const counts = new Map<string, { total: number; abertas: number; fechadas: number }>();

  for (const issue of issues) {
    const raw =
      field === "tipo"
        ? issue.tipo
        : field === "modulo"
          ? issue.modulo
          : issue.parceiro;
    const label = raw?.trim() || (field === "parceiro" ? "Sem Parceiro" : "Não informado");
    const current = counts.get(label) ?? { total: 0, abertas: 0, fechadas: 0 };
    current.total += 1;
    counts.set(label, current);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([label, stats]) => ({
      label,
      total: stats.total,
      abertas: stats.abertas,
      fechadas: stats.fechadas,
      pct_conclusao:
        stats.total > 0 ? Math.round((stats.fechadas / stats.total) * 100) : 0,
    }));
}

export function resolveDistribuicaoRows(
  rows: AnalistaDistribuicaoRow[],
  issues: { tipo?: string | null; modulo?: string | null; parceiro?: string | null }[],
  field: "tipo" | "modulo" | "parceiro",
): AnalistaDistribuicaoRow[] {
  if (rows.length > 0) return rows;
  return aggregateDistribuicaoFromIssues(issues, field);
}
