import { describe, expect, it } from "vitest";

import {
  formatMilestoneWipRefLabel,
  milestoneMixToChartPoints,
  milestoneMixToComparisonBars,
  milestoneWipToChartPoints,
  splitMilestoneMixBySerie,
  sumMilestoneMixSerie,
  sumMilestoneWip,
  type MilestoneMixRow,
} from "@/lib/dashboard/milestone-aggregates";

const MIX_ROWS: MilestoneMixRow[] = [
  { serie: "comprometido", label: "Bug", quantidade: 10 },
  { serie: "comprometido", label: "Melhoria", quantidade: 5 },
  { serie: "entregue", label: "Bug", quantidade: 8 },
  { serie: "entregue", label: "Melhoria", quantidade: 3 },
];

describe("milestone-aggregates", () => {
  it("splitMilestoneMixBySerie separa comprometido e entregue", () => {
    const { comprometido, entregue } = splitMilestoneMixBySerie(MIX_ROWS);
    expect(comprometido).toHaveLength(2);
    expect(entregue).toHaveLength(2);
  });

  it("milestoneMixToChartPoints filtra série e ordena por quantidade", () => {
    const points = milestoneMixToChartPoints(MIX_ROWS, "comprometido", "tipo");
    expect(points.map((p) => p.label)).toEqual(["Bug", "Melhoria"]);
    expect(points[0]?.quantidade).toBe(10);
  });

  it("milestoneMixToComparisonBars agrupa por label", () => {
    const bars = milestoneMixToComparisonBars(MIX_ROWS);
    expect(bars).toEqual([
      { label: "Bug", comprometido: 10, entregue: 8 },
      { label: "Melhoria", comprometido: 5, entregue: 3 },
    ]);
  });

  it("milestoneWipToChartPoints ignora etapas zeradas", () => {
    const points = milestoneWipToChartPoints([
      { ref_date: "2026-01-17", etapa: "Em Teste", quantidade: 4, story_points: 8 },
      { ref_date: "2026-01-17", etapa: "A Fazer", quantidade: 0, story_points: 0 },
    ]);
    expect(points).toEqual([{ label: "Em Teste", quantidade: 4 }]);
  });

  it("sumMilestoneMixSerie e sumMilestoneWip", () => {
    expect(sumMilestoneMixSerie(MIX_ROWS, "comprometido")).toBe(15);
    expect(
      sumMilestoneWip([
        { ref_date: "2026-01-17", etapa: "Em Teste", quantidade: 2, story_points: 3 },
        { ref_date: "2026-01-17", etapa: "A Fazer", quantidade: 1, story_points: 2 },
      ]),
    ).toBe(3);
  });

  it("formatMilestoneWipRefLabel distingue fechamento e hoje", () => {
    expect(formatMilestoneWipRefLabel("2026-01-17", "2026-01-17")).toContain("fechamento");
    expect(formatMilestoneWipRefLabel("2026-07-03", "2026-01-17")).toContain("hoje");
  });
});
