import type {
  FlowBottleneckRow,
  FlowCfdRow,
  FlowDataQualityRow,
  FlowLeadTimeAggRow,
  FlowStageDwellRow,
  FlowThroughputRow,
  FlowWorkItemAgeRow,
} from "@/lib/dashboard/flow-report";
import { issueKeyToIid } from "@/lib/dashboard/gitlab-url";
import { FLOW_CFD_ETAPAS, FLOW_DWELL_ETAPAS, isWipEtapa } from "@/lib/dashboard/flow-stages";
import { formatPercent } from "@/lib/format";

export type KpiTrendCompare = {
  kind: "compare";
  direction: "up" | "down";
  percent: number;
  sentiment: "positive" | "negative";
};

export type KpiTrendEmpty = {
  kind: "empty";
  label: string;
};

export type KpiTrend = KpiTrendCompare | KpiTrendEmpty;

/** Limiar padrão para contagem de outliers na distribuição de lead time. */
export const LEAD_TIME_OUTLIER_THRESHOLD_DAYS = 90;

export type LeadTimeDistributionSummary = {
  count: number;
  mediana: number | null;
  p85: number | null;
  p95: number | null;
  desvioPadrao: number | null;
  outliersAcima90: number;
};

/**
 * Percentil contínuo (linear) — espelha PostgreSQL `percentile_cont`.
 * Calculado em TS sobre `report_flow_lead_time_detail` para a distribuição global
 * do período; buckets temporais do gráfico continuam agregados no SQL.
 */
export function percentileCont(sortedValues: number[], fraction: number): number | null {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];

  const position = (sortedValues.length - 1) * fraction;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) return sortedValues[lowerIndex];

  const weight = position - lowerIndex;
  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
}

function populationStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function summarizeLeadTimeDistribution(
  rows: { lead_time_dias: number }[],
  options?: { outlierThresholdDays?: number },
): LeadTimeDistributionSummary | null {
  const values = rows
    .map((row) => Number(row.lead_time_dias))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const threshold = options?.outlierThresholdDays ?? LEAD_TIME_OUTLIER_THRESHOLD_DAYS;

  return {
    count: values.length,
    mediana: percentileCont(values, 0.5),
    p85: percentileCont(values, 0.85),
    p95: percentileCont(values, 0.95),
    desvioPadrao: populationStdDev(values),
    outliersAcima90: values.filter((value) => value > threshold).length,
  };
}

export type FlowAgingChartPoint = {
  label: string;
  issueKey: string;
  dias: number;
  critica: boolean;
  etapa: string;
};

export type FlowStageDwellMeta = {
  issuesTotalPeriodo: number;
  issuesComProxy: number;
};

export type FlowStageDwellChartPoint = {
  label: string;
  mediana: number;
  media: number;
  quantidadeIssues: number;
};

export type FlowDataQualitySummary = {
  totalIssues: number;
  comEventos: number;
  comSnapshotApenas: number;
  comProxy: number;
  pctEventosReais: number;
  pctSnapshotApenas: number;
  pctProxy: number;
  pctAproximacao: number;
  headline: string;
};

export type CfdChartPoint = {
  data: string;
  [etapa: string]: string | number;
};

export function pivotCfdRows(rows: FlowCfdRow[]): CfdChartPoint[] {
  const byDate = new Map<string, CfdChartPoint>();

  for (const row of rows) {
    const dateKey = row.data_referencia;
    if (!byDate.has(dateKey)) {
      const point: CfdChartPoint = { data: dateKey };
      for (const etapa of FLOW_CFD_ETAPAS) {
        point[etapa] = 0;
      }
      byDate.set(dateKey, point);
    }
    byDate.get(dateKey)![row.etapa] = row.quantidade;
  }

  return Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));
}

export function throughputToChartPoints(rows: FlowThroughputRow[]) {
  return rows.map((row) => ({
    periodo: row.periodo,
    concluidas: row.quantidade_concluida,
  }));
}

export function leadTimeAggToChartPoints(rows: FlowLeadTimeAggRow[]) {
  return rows.map((row) => ({
    periodo: row.periodo,
    media: row.lead_time_medio ?? 0,
    mediana: row.lead_time_mediana ?? 0,
    p85: row.percentil_85 ?? 0,
  }));
}

export function sumWip(rows: { quantidade: number }[]): number {
  return rows.reduce((total, row) => total + row.quantidade, 0);
}

/** Soma WIP (A Fazer → Homologação) a partir do CFD em uma data de referência. */
export function sumWipFromCfd(
  rows: FlowCfdRow[],
  date?: string,
): number {
  return rows
    .filter((row) => (!date || row.data_referencia === date) && isWipEtapa(row.etapa))
    .reduce((total, row) => total + row.quantidade, 0);
}

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

type BuildKpiTrendOptions = {
  lowerIsBetter?: boolean;
  hasBaseline?: boolean;
};

export function buildKpiTrend(
  current: number,
  previous: number | null,
  options: BuildKpiTrendOptions = {},
): KpiTrend | null {
  const { lowerIsBetter = false, hasBaseline = true } = options;

  if (!hasBaseline || previous == null) {
    return { kind: "empty", label: "sem base" };
  }

  const change = computePercentChange(current, previous);
  if (change == null) {
    return { kind: "empty", label: "sem base" };
  }

  const direction: KpiTrendCompare["direction"] = change >= 0 ? "up" : "down";
  const improved = lowerIsBetter ? change <= 0 : change >= 0;

  return {
    kind: "compare",
    direction,
    percent: change,
    sentiment: improved ? "positive" : "negative",
  };
}

export function averageLeadTime(rows: FlowLeadTimeAggRow[]): number | null {
  const withQty = rows.filter((row) => row.quantidade > 0 && row.lead_time_medio != null);
  if (withQty.length === 0) return null;

  const weighted = withQty.reduce(
    (acc, row) => acc + Number(row.lead_time_medio) * row.quantidade,
    0,
  );
  const qty = withQty.reduce((acc, row) => acc + row.quantidade, 0);
  return qty > 0 ? weighted / qty : null;
}

export function weightedMedianLeadTime(rows: FlowLeadTimeAggRow[]): number | null {
  const withQty = rows.filter((row) => row.quantidade > 0 && row.lead_time_mediana != null);
  if (withQty.length === 0) return null;

  const weighted = withQty.reduce(
    (acc, row) => acc + Number(row.lead_time_mediana) * row.quantidade,
    0,
  );
  const qty = withQty.reduce((acc, row) => acc + row.quantidade, 0);
  return qty > 0 ? weighted / qty : null;
}

export function averagePeriodThroughput(rows: FlowThroughputRow[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.quantidade_concluida, 0);
  return total / rows.length;
}

export function extractStageDwellMeta(rows: FlowStageDwellRow[]): FlowStageDwellMeta | null {
  const first = rows[0];
  if (!first) return null;

  return {
    issuesTotalPeriodo: first.issues_total_periodo,
    issuesComProxy: first.issues_com_proxy,
  };
}

export function stageDwellToChartPoints(rows: FlowStageDwellRow[]): FlowStageDwellChartPoint[] {
  const order = new Map(FLOW_DWELL_ETAPAS.map((etapa, index) => [etapa, index]));

  return rows
    .filter((row) => row.quantidade_issues > 0 && row.tempo_mediano_dias != null)
    .map((row) => ({
      label: row.etapa,
      mediana: Number(row.tempo_mediano_dias),
      media: Number(row.tempo_medio_dias ?? row.tempo_mediano_dias),
      quantidadeIssues: row.quantidade_issues,
    }))
    .sort((a, b) => (order.get(a.label as (typeof FLOW_DWELL_ETAPAS)[number]) ?? 99)
      - (order.get(b.label as (typeof FLOW_DWELL_ETAPAS)[number]) ?? 99));
}

export function pickStageWithMaxMedianDwell(rows: FlowStageDwellRow[]): FlowStageDwellRow | null {
  const candidates = rows.filter(
    (row) => row.quantidade_issues > 0 && row.tempo_mediano_dias != null,
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((max, row) =>
    Number(row.tempo_mediano_dias) > Number(max.tempo_mediano_dias) ? row : max,
  );
}

function roundPct(value: number): number {
  return Math.round(value * 10) / 10;
}

export function summarizeFlowDataQuality(row: FlowDataQualityRow | null): FlowDataQualitySummary | null {
  if (!row || row.total_issues <= 0) return null;

  const pctEventosReais = roundPct(Number(row.pct_eventos_reais ?? 0));
  const pctSnapshotApenas = roundPct(Number(row.pct_snapshot_apenas ?? 0));
  const pctProxy = roundPct(Number(row.pct_proxy ?? 0));
  const pctAproximacao = roundPct(pctSnapshotApenas + pctProxy);

  const headline =
    pctSnapshotApenas > 0
      ? `${formatPercent(pctEventosReais)} histórico real · ${formatPercent(pctAproximacao)} aproximação`
      : `${formatPercent(pctEventosReais)} histórico real · ${formatPercent(pctProxy)} aproximação (proxy)`;

  return {
    totalIssues: row.total_issues,
    comEventos: row.com_eventos,
    comSnapshotApenas: row.com_snapshot_apenas,
    comProxy: row.com_proxy,
    pctEventosReais,
    pctSnapshotApenas,
    pctProxy,
    pctAproximacao,
    headline,
  };
}

export function pickPrimaryBottleneck(rows: FlowBottleneckRow[]): FlowBottleneckRow | null {
  const candidates = rows.filter((row) => row.quantidade_atual > 0);
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((row) => ({
      row,
      score: row.quantidade_atual * (row.idade_media_dias ?? 0),
      wip: isWipEtapa(row.etapa),
    }))
    .sort((a, b) => {
      if (a.wip !== b.wip) return a.wip ? -1 : 1;
      return b.score - a.score;
    });

  return scored[0]?.row ?? null;
}

export function workItemAgeToChartPoints(
  rows: FlowWorkItemAgeRow[],
  leadTimeReferencia: number | null,
): FlowAgingChartPoint[] {
  return rows.map((row) => ({
    label: issueKeyToIid(row.issue_key),
    issueKey: row.issue_key,
    dias: row.dias_em_andamento,
    critica: leadTimeReferencia != null && row.dias_em_andamento > leadTimeReferencia,
    etapa: row.etapa_atual,
  }));
}

export type FlowPeriodPreset = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

export function flowPeriodPresets(reference = new Date()): FlowPeriodPreset[] {
  const endDate = reference.toISOString().slice(0, 10);

  const last30 = new Date(reference);
  last30.setDate(last30.getDate() - 29);

  const last90 = new Date(reference);
  last90.setDate(last90.getDate() - 89);

  const monthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);

  return [
    { id: "30d", label: "30 dias", startDate: last30.toISOString().slice(0, 10), endDate },
    { id: "90d", label: "90 dias", startDate: last90.toISOString().slice(0, 10), endDate },
    {
      id: "month",
      label: "Mês atual",
      startDate: monthStart.toISOString().slice(0, 10),
      endDate,
    },
  ];
}

export function defaultFlowDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 59);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
