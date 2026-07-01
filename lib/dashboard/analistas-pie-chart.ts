import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

import type { AnalistaDistribuicaoRow } from "@/types/analistas";

const require = createRequire(import.meta.url);

const CHART_FONT_FAMILY = "DejaVu Sans";

/** resvg/fontdb só aceita TTF/OTF — WOFF/WOFF2 falham silenciosamente em serverless. */
const CHART_FONT_FILES = ["DejaVuSans.ttf", "DejaVuSans-Bold.ttf"] as const;

const CHART_FONT_DIR = path.join(process.cwd(), "assets", "chart-fonts");

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

function getDejavuTtfDir(): string {
  const pkgJson = require.resolve("@vintproykt/dejavu-fonts-ttf/package.json");
  return path.join(path.dirname(pkgJson), "ttf");
}

function resolveChartFontPath(filename: (typeof CHART_FONT_FILES)[number]): string {
  const bundled = path.join(CHART_FONT_DIR, filename);
  if (fs.existsSync(bundled)) return bundled;
  return path.join(getDejavuTtfDir(), filename);
}

function getChartFontDir(): string | null {
  return fs.existsSync(CHART_FONT_DIR) ? CHART_FONT_DIR : null;
}

function getChartFonts(): string[] {
  return CHART_FONT_FILES.map(resolveChartFontPath).filter((filePath) => fs.existsSync(filePath));
}

function chartTextAttrs(options: { size?: number; weight?: number; fill?: string } = {}): string {
  const size = options.size ?? 13;
  const weight = options.weight ? ` font-weight="${options.weight}"` : "";
  const fill = options.fill ?? "#334155";
  return `font-family="${CHART_FONT_FAMILY}, sans-serif" font-size="${size}"${weight} fill="${fill}"`;
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
  const fontDir = getChartFontDir();
  const fontFiles = getChartFonts();

  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
      ...(fontDir ? { fontDirs: [fontDir] } : {}),
      ...(fontFiles.length > 0 ? { fontFiles } : {}),
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
  const sliceLabels: string[] = [];
  const legend: string[] = [];

  slices.forEach((row, index) => {
    const pct = sum > 0 ? (row.total / sum) * 100 : 0;
    const sweep = sum > 0 ? (row.total / sum) * 360 : 0;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const startAngle = angle;
    const end = angle + sweep;
    paths.push(
      `<path d="${describeSlicePath(cx, cy, radius, startAngle, end)}" fill="${color}" stroke="#ffffff" stroke-width="1.5" />`,
    );

    if (pct >= 5 && sweep >= 18) {
      const mid = startAngle + sweep / 2;
      const labelPos = polarToCartesian(cx, cy, radius * 0.62, mid);
      const labelFill = pct >= 35 ? "#ffffff" : "#0f172a";
      sliceLabels.push(`
        <text x="${labelPos.x.toFixed(2)}" y="${labelPos.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" ${chartTextAttrs({ size: 12, weight: 700, fill: labelFill })}>
          ${row.total} (${pct.toFixed(0)}%)
        </text>
      `);
    }

    legend.push(`
      <rect x="320" y="${24 + index * 28}" width="14" height="14" fill="${color}" rx="2" />
      <text x="344" y="${35 + index * 28}" ${chartTextAttrs()}>
        ${escapeXml(truncateLabel(row.label))} (${row.total} · ${pct.toFixed(0)}%)
      </text>
    `);
    angle = end;
  });

  if (slices.length === 0) {
    paths.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#E2E8F0" />`);
    legend.push(`
      <text x="320" y="40" ${chartTextAttrs({ fill: "#64748B" })}>
        Sem dados para o recorte selecionado.
      </text>
    `);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="16" y="24" ${chartTextAttrs({ size: 14, weight: 700, fill: "#0f172a" })}>
    ${escapeXml(title)}
  </text>
  ${paths.join("\n")}
  ${sliceLabels.join("\n")}
  ${legend.join("\n")}
</svg>`;

  return { svg, width, height };
}

/** Expõe SVG para testes (rótulos devem estar no markup). */
export function buildDistribuicaoPieChartSvgForTest(
  title: string,
  rows: AnalistaDistribuicaoRow[],
): string {
  return buildDistribuicaoPieChartSvg(title, rows).svg;
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
