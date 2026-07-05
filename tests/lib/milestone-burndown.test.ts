import { describe, expect, it } from "vitest";

import type { MilestoneBurndownRow } from "@/lib/dashboard/milestone-aggregates";
import {
  buildBurndownSprintCompare,
  computeIdealRemaining,
  computeLastMinuteDeliveryKpi,
  milestoneBurndownHasStoryPoints,
  milestoneBurndownToChartSeries,
  parseMilestoneBurndownGranularity,
  parseMilestoneBurndownMetric,
  resolveBurndownCompareIids,
} from "@/lib/dashboard/milestone-burndown";

function row(
  date: string,
  overrides: Partial<MilestoneBurndownRow> = {},
): MilestoneBurndownRow {
  return {
    snapshot_date: date,
    points_remaining: 50,
    issues_open: 5,
    points_done: 0,
    issues_done: 0,
    points_committed: 50,
    issues_committed: 5,
    points_ideal: 50,
    source: "reconstructed",
    ...overrides,
  };
}

describe("parseMilestoneBurndownMetric", () => {
  it("usa pontos por padrão", () => {
    expect(parseMilestoneBurndownMetric(null)).toBe("pontos");
    expect(parseMilestoneBurndownMetric(undefined)).toBe("pontos");
  });

  it("aceita issues", () => {
    expect(parseMilestoneBurndownMetric("issues")).toBe("issues");
  });
});

describe("parseMilestoneBurndownGranularity", () => {
  it("usa day por padrão", () => {
    expect(parseMilestoneBurndownGranularity(null)).toBe("day");
  });

  it("aceita week", () => {
    expect(parseMilestoneBurndownGranularity("week")).toBe("week");
  });
});

describe("computeIdealRemaining", () => {
  it("interpola linearmente do comprometido ao zero", () => {
    expect(computeIdealRemaining(100, "2026-01-01", "2026-01-11", "2026-01-01")).toBe(100);
    expect(computeIdealRemaining(100, "2026-01-01", "2026-01-11", "2026-01-06")).toBe(50);
    expect(computeIdealRemaining(100, "2026-01-01", "2026-01-11", "2026-01-11")).toBe(0);
  });

  it("retorna null sem datas", () => {
    expect(computeIdealRemaining(100, null, "2026-01-11", "2026-01-06")).toBeNull();
  });
});

describe("milestoneBurndownToChartSeries", () => {
  const milestone = { start_date: "2026-01-01", due_date: "2026-01-11" };

  it("mapeia pontos e percentual entregue", () => {
    const series = milestoneBurndownToChartSeries(
      [
        row("2026-01-01"),
        row("2026-01-06", { points_done: 25, points_remaining: 25, points_ideal: 50 }),
      ],
      "pontos",
      milestone,
    );

    expect(series).toHaveLength(2);
    expect(series[1]?.remaining).toBe(25);
    expect(series[1]?.pctDelivered).toBe(50);
    expect(series[1]?.ideal).toBe(50);
  });

  it("calcula ideal de issues client-side", () => {
    const series = milestoneBurndownToChartSeries(
      [row("2026-01-06", { issues_done: 2, issues_open: 3, issues_committed: 10 })],
      "issues",
      milestone,
    );

    expect(series[0]?.ideal).toBe(5);
  });

  it("agrega por semana mantendo último dia da semana", () => {
    const series = milestoneBurndownToChartSeries(
      [
        row("2026-01-01", { points_done: 0 }),
        row("2026-01-02", { points_done: 10 }),
        row("2026-01-08", { points_done: 40 }),
      ],
      "pontos",
      milestone,
      "week",
    );

    expect(series.length).toBeGreaterThanOrEqual(2);
    expect(series.at(-1)?.done).toBe(40);
  });
});

describe("computeLastMinuteDeliveryKpi", () => {
  it("calcula percentuais no meio e na última semana", () => {
    const rows = [
      row("2026-01-01", { points_done: 0, points_remaining: 100, points_committed: 100 }),
      row("2026-01-06", { points_done: 30, points_remaining: 70, points_committed: 100 }),
      row("2026-01-04", { points_done: 50, points_remaining: 50, points_committed: 100 }),
      row("2026-01-11", { points_done: 80, points_remaining: 20, points_committed: 100 }),
    ].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

    const kpi = computeLastMinuteDeliveryKpi(rows, "pontos", "2026-01-01", "2026-01-11");

    expect(kpi.midpointPct).toBe(30);
    expect(kpi.lastWeekPct).toBe(30);
    expect(kpi.lastMinuteIndex).toBe(1);
  });
});

describe("resolveBurndownCompareIids", () => {
  it("prioriza sprints 89, 90, 91 quando existem", () => {
    expect(resolveBurndownCompareIids(90, [88, 89, 90, 91, 92])).toEqual([89, 90, 91]);
  });

  it("cai para janela ao redor da sprint atual", () => {
    expect(resolveBurndownCompareIids(95, [93, 94, 95, 96])).toEqual([94, 95, 96]);
  });
});

describe("milestoneBurndownHasStoryPoints", () => {
  it("detecta pontos comprometidos", () => {
    expect(milestoneBurndownHasStoryPoints([row("2026-01-01")])).toBe(true);
    expect(
      milestoneBurndownHasStoryPoints([
        row("2026-01-01", { points_committed: 0, points_remaining: 0 }),
      ]),
    ).toBe(false);
  });
});

describe("buildBurndownSprintCompare", () => {
  it("monta série percentual e KPI", () => {
    const compare = buildBurndownSprintCompare(
      90,
      [
        row("2026-01-01", { points_committed: 100 }),
        row("2026-01-11", { points_done: 50, points_remaining: 50, points_committed: 100 }),
      ],
      "pontos",
      { start_date: "2026-01-01", due_date: "2026-01-11" },
    );

    expect(compare.milestoneIid).toBe(90);
    expect(compare.pctSeries.at(-1)?.pctDelivered).toBe(50);
    expect(compare.kpi.midpointPct).not.toBeNull();
  });
});
