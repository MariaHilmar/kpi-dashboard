import { describe, expect, it } from "vitest";

import {
  buildKpiTrend,
  computePercentChange,
  averageLeadTime,
  averagePeriodThroughput,
  percentileCont,
  pickPrimaryBottleneck,
  pickStageWithMaxMedianDwell,
  pivotCfdRows,
  extractStageDwellMeta,
  stageDwellToChartPoints,
  summarizeFlowDataQuality,
  summarizeLeadTimeDistribution,
  sumWip,
  sumWipFromCfd,
  throughputToChartPoints,
  weightedMedianLeadTime,
  workItemAgeToChartPoints,
} from "@/lib/dashboard/flow-charts";
import type { FlowBottleneckRow, FlowCfdRow, FlowLeadTimeAggRow } from "@/lib/dashboard/flow-report";

describe("pivotCfdRows", () => {
  it("agrupa quantidades por data e etapa", () => {
    const rows: FlowCfdRow[] = [
      { data_referencia: "2026-06-01", etapa: "Backlog", quantidade: 5 },
      { data_referencia: "2026-06-01", etapa: "Em Desenvolvimento", quantidade: 2 },
      { data_referencia: "2026-06-02", etapa: "Backlog", quantidade: 4 },
    ];

    const chart = pivotCfdRows(rows);
    expect(chart).toHaveLength(2);
    expect(chart[0].Backlog).toBe(5);
    expect(chart[0]["Em Desenvolvimento"]).toBe(2);
    expect(chart[1].Backlog).toBe(4);
  });
});

describe("sumWip", () => {
  it("soma quantidades de WIP", () => {
    expect(
      sumWip([
        { quantidade: 3 },
        { quantidade: 5 },
      ]),
    ).toBe(8);
  });
});

describe("sumWipFromCfd", () => {
  it("soma apenas etapas WIP na data informada", () => {
    const rows: FlowCfdRow[] = [
      { data_referencia: "2026-06-01", etapa: "Backlog", quantidade: 10 },
      { data_referencia: "2026-06-01", etapa: "A Fazer", quantidade: 3 },
      { data_referencia: "2026-06-01", etapa: "Em Desenvolvimento", quantidade: 2 },
      { data_referencia: "2026-06-02", etapa: "A Fazer", quantidade: 5 },
    ];

    expect(sumWipFromCfd(rows, "2026-06-01")).toBe(5);
  });
});

describe("computePercentChange", () => {
  it("calcula variação percentual", () => {
    expect(computePercentChange(82, 100)).toBeCloseTo(-18);
    expect(computePercentChange(112, 100)).toBeCloseTo(12);
  });

  it("retorna null quando a base é zero", () => {
    expect(computePercentChange(10, 0)).toBeNull();
  });
});

describe("buildKpiTrend", () => {
  it("marca queda de lead time como positiva", () => {
    const trend = buildKpiTrend(82, 100, { lowerIsBetter: true });
    expect(trend).toMatchObject({
      kind: "compare",
      direction: "down",
      sentiment: "positive",
    });
  });

  it("marca alta de issues concluídas como positiva", () => {
    const trend = buildKpiTrend(112, 100);
    expect(trend).toMatchObject({
      kind: "compare",
      direction: "up",
      sentiment: "positive",
    });
  });

  it("retorna empty state sem base comparável", () => {
    expect(buildKpiTrend(10, 0)).toEqual({ kind: "empty", label: "sem base" });
    expect(buildKpiTrend(10, 5, { hasBaseline: false })).toEqual({
      kind: "empty",
      label: "sem base",
    });
  });
});

describe("throughputToChartPoints", () => {
  it("mapeia para série do gráfico", () => {
    expect(
      throughputToChartPoints([{ periodo: "2026-W23", quantidade_concluida: 4 }]),
    ).toEqual([{ periodo: "2026-W23", concluidas: 4 }]);
  });
});

describe("averageLeadTime", () => {
  it("calcula média ponderada por quantidade", () => {
    const rows: FlowLeadTimeAggRow[] = [
      { periodo: "2026-06", lead_time_medio: 10, lead_time_mediana: 8, percentil_85: 15, quantidade: 2 },
      { periodo: "2026-07", lead_time_medio: 20, lead_time_mediana: 18, percentil_85: 25, quantidade: 1 },
    ];
    expect(averageLeadTime(rows)).toBeCloseTo(13.333, 2);
  });
});

describe("weightedMedianLeadTime", () => {
  it("pondera medianas por quantidade concluída", () => {
    const rows: FlowLeadTimeAggRow[] = [
      { periodo: "2026-06", lead_time_medio: 10, lead_time_mediana: 8, percentil_85: 15, quantidade: 2 },
      { periodo: "2026-07", lead_time_medio: 20, lead_time_mediana: 18, percentil_85: 25, quantidade: 1 },
    ];
    expect(weightedMedianLeadTime(rows)).toBeCloseTo(11.333, 2);
  });
});

describe("percentileCont", () => {
  it("calcula mediana e percentis com interpolação linear", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentileCont(values, 0.5)).toBeCloseTo(5.5);
    expect(percentileCont(values, 0.85)).toBeCloseTo(8.65);
    expect(percentileCont(values, 0.95)).toBeCloseTo(9.55);
  });

  it("retorna null para amostra vazia", () => {
    expect(percentileCont([], 0.5)).toBeNull();
  });
});

describe("summarizeLeadTimeDistribution", () => {
  it("agrega mediana, percentis, desvio e outliers", () => {
    const summary = summarizeLeadTimeDistribution([
      { lead_time_dias: 10 },
      { lead_time_dias: 20 },
      { lead_time_dias: 30 },
      { lead_time_dias: 95 },
      { lead_time_dias: 120 },
    ]);

    expect(summary).toMatchObject({
      count: 5,
      mediana: 30,
      outliersAcima90: 2,
    });
    expect(summary?.p85).toBeGreaterThan(summary!.mediana!);
    expect(summary?.p95).toBeGreaterThan(summary!.p85!);
    expect(summary?.desvioPadrao).toBeGreaterThan(0);
  });

  it("retorna null sem issues fechadas", () => {
    expect(summarizeLeadTimeDistribution([])).toBeNull();
  });
});

describe("summarizeFlowDataQuality", () => {
  it("monta headline com proxy quando não há snapshot", () => {
    const summary = summarizeFlowDataQuality({
      total_issues: 100,
      com_eventos: 98,
      com_snapshot_apenas: 0,
      com_proxy: 2,
      pct_eventos_reais: 98,
      pct_snapshot_apenas: 0,
      pct_proxy: 2,
    });

    expect(summary).toMatchObject({
      pctEventosReais: 98,
      pctProxy: 2,
      pctAproximacao: 2,
    });
    expect(summary?.headline).toContain("98,0% histórico real");
    expect(summary?.headline).toContain("2,0% aproximação (proxy)");
  });

  it("agrega snapshot e proxy como aproximação", () => {
    const summary = summarizeFlowDataQuality({
      total_issues: 200,
      com_eventos: 170,
      com_snapshot_apenas: 26,
      com_proxy: 4,
      pct_eventos_reais: 85,
      pct_snapshot_apenas: 13,
      pct_proxy: 2,
    });

    expect(summary?.pctAproximacao).toBe(15);
    expect(summary?.headline).toContain("85,0% histórico real");
    expect(summary?.headline).toContain("15,0% aproximação");
    expect(summary?.headline).not.toContain("(proxy)");
  });

  it("retorna null sem issues no recorte", () => {
    expect(summarizeFlowDataQuality(null)).toBeNull();
    expect(
      summarizeFlowDataQuality({
        total_issues: 0,
        com_eventos: 0,
        com_snapshot_apenas: 0,
        com_proxy: 0,
        pct_eventos_reais: null,
        pct_snapshot_apenas: null,
        pct_proxy: null,
      }),
    ).toBeNull();
  });
});

describe("stage dwell transforms", () => {
  const rows = [
    {
      etapa: "Em Desenvolvimento",
      tempo_medio_dias: 7,
      tempo_mediano_dias: 7,
      quantidade_issues: 10,
      issues_total_periodo: 12,
      issues_com_proxy: 2,
    },
    {
      etapa: "Em Teste",
      tempo_medio_dias: 24,
      tempo_mediano_dias: 22,
      quantidade_issues: 8,
      issues_total_periodo: 12,
      issues_com_proxy: 2,
    },
    {
      etapa: "Backlog",
      tempo_medio_dias: 0,
      tempo_mediano_dias: null,
      quantidade_issues: 0,
      issues_total_periodo: 12,
      issues_com_proxy: 2,
    },
  ];

  it("extrai metadados de proxy do primeiro row", () => {
    expect(extractStageDwellMeta(rows)).toEqual({
      issuesTotalPeriodo: 12,
      issuesComProxy: 2,
    });
  });

  it("mapeia apenas etapas com issues para o gráfico", () => {
    expect(stageDwellToChartPoints(rows)).toEqual([
      {
        label: "Em Desenvolvimento",
        mediana: 7,
        media: 7,
        quantidadeIssues: 10,
      },
      {
        label: "Em Teste",
        mediana: 22,
        media: 24,
        quantidadeIssues: 8,
      },
    ]);
  });

  it("identifica etapa com maior mediana de permanência", () => {
    expect(pickStageWithMaxMedianDwell(rows)?.etapa).toBe("Em Teste");
  });
});

describe("averagePeriodThroughput", () => {
  it("calcula média por bucket", () => {
    expect(
      averagePeriodThroughput([
        { periodo: "2026-W01", quantidade_concluida: 4 },
        { periodo: "2026-W02", quantidade_concluida: 6 },
      ]),
    ).toBe(5);
  });
});

describe("pickPrimaryBottleneck", () => {
  it("prioriza etapas WIP com maior score volume x idade", () => {
    const rows: FlowBottleneckRow[] = [
      {
        etapa: "Backlog",
        quantidade_atual: 20,
        idade_media_dias: 30,
        maior_idade_dias: 90,
        observacao: null,
      },
      {
        etapa: "Em Desenvolvimento",
        quantidade_atual: 8,
        idade_media_dias: 14,
        maior_idade_dias: 40,
        observacao: "Possível retenção",
      },
    ];

    expect(pickPrimaryBottleneck(rows)?.etapa).toBe("Em Desenvolvimento");
  });
});

describe("workItemAgeToChartPoints", () => {
  it("marca issues acima da mediana do lead time de referência", () => {
    const points = workItemAgeToChartPoints(
      [
        {
          issue_id: "1",
          issue_key: "Contratos v2:100",
          titulo: "Teste",
          etapa_atual: "Em Desenvolvimento",
          responsavel: "Ana",
          data_inicio_fluxo: "2026-01-01",
          dias_em_andamento: 20,
        },
        {
          issue_id: "2",
          issue_key: "Contratos v2:200",
          titulo: "Outra",
          etapa_atual: "Em Teste",
          responsavel: "Bob",
          data_inicio_fluxo: "2026-05-01",
          dias_em_andamento: 5,
        },
      ],
      12,
    );

    expect(points).toHaveLength(2);
    expect(points[0].label).toBe("100");
    expect(points[0].critica).toBe(true);
    expect(points[1].critica).toBe(false);
  });
});
