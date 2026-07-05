import {
  describe,
  expect,
  it,
} from "vitest";

import { TODOS } from "@/lib/dashboard/constants";
import {
  milestoneCapacityHasStoryPoints,
  milestoneCapacityHeatmapIntensity,
  milestoneCapacityTeamOptions,
  milestoneCapacityToHeatmap,
  milestoneCapacityToLineSeries,
  milestoneCapacityUniqueTeams,
  parseMilestoneCapacityMetric,
  parseMilestoneCapacityTeam,
  resolveMilestoneCapacityRange,
} from "@/lib/dashboard/milestone-capacity";
import type { MilestoneOption } from "@/lib/dashboard/milestone-options";
import { resolveLatestMilestoneIid } from "@/lib/dashboard/milestone-options";

const milestones: MilestoneOption[] = [
  { id: "1", gitlab_milestone_iid: 85, titulo: "Sprint 85" },
  { id: "2", gitlab_milestone_iid: 88, titulo: "Sprint 88" },
  { id: "3", gitlab_milestone_iid: 90, titulo: "Sprint 90" },
];

const sampleRows = [
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    equipe: "Alpha",
    fechadas: 4,
    entregues: 3,
    pontos_entregues: 13,
  },
  {
    milestone_iid: 90,
    milestone_titulo: "Sprint 90",
    equipe: "Alpha",
    fechadas: 6,
    entregues: 5,
    pontos_entregues: 21,
  },
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    equipe: "Beta",
    fechadas: 3,
    entregues: 2,
    pontos_entregues: 8,
  },
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    equipe: "Não informado",
    fechadas: 2,
    entregues: 1,
    pontos_entregues: 5,
  },
  {
    milestone_iid: 90,
    milestone_titulo: "Sprint 90",
    equipe: "Não informado",
    fechadas: 1,
    entregues: 1,
    pontos_entregues: 3,
  },
];

const teamOptions = [TODOS, "Não informado", "Alpha", "Beta", "G4F"];

describe("parseMilestoneCapacityMetric", () => {
  it("usa pontos como padrão", () => {
    expect(parseMilestoneCapacityMetric(null)).toBe("pontos");
    expect(parseMilestoneCapacityMetric(undefined)).toBe("pontos");
  });

  it("aceita issues", () => {
    expect(parseMilestoneCapacityMetric("issues")).toBe("issues");
  });
});

describe("resolveMilestoneCapacityRange", () => {
  it("usa janela padrão quando params ausentes", () => {
    expect(resolveMilestoneCapacityRange(milestones, null, null)).toEqual({
      fromIid: 85,
      toIid: 90,
    });
  });

  it("normaliza from/to invertidos", () => {
    expect(resolveMilestoneCapacityRange(milestones, "90", "85")).toEqual({
      fromIid: 85,
      toIid: 90,
    });
  });

  it("retorna null sem milestones", () => {
    expect(resolveMilestoneCapacityRange([], null, null)).toBeNull();
  });

  it("ancora janela na sprint anterior → atual quando from/to ausentes", () => {
    expect(resolveMilestoneCapacityRange(milestones, null, null, 90)).toEqual({
      fromIid: 88,
      toIid: 90,
    });
  });

  it("respeita from/to explícitos mesmo com anchor", () => {
    expect(resolveMilestoneCapacityRange(milestones, "85", "88", 90)).toEqual({
      fromIid: 85,
      toIid: 88,
    });
  });
});

describe("resolveLatestMilestoneIid", () => {
  it("retorna o maior IID da lista", () => {
    expect(resolveLatestMilestoneIid(milestones)).toBe(90);
  });

  it("retorna null sem milestones", () => {
    expect(resolveLatestMilestoneIid([])).toBeNull();
  });
});

describe("milestoneCapacityToHeatmap", () => {
  it("monta linha Todos no topo e detalhe por equipe abaixo", () => {
    const heatmap = milestoneCapacityToHeatmap(sampleRows, "issues", teamOptions);

    expect(heatmap.teams).toEqual([TODOS, "Não informado", "Alpha", "Beta", "G4F"]);
    expect(heatmap.sprints.map((s) => s.milestone_iid)).toEqual([88, 90]);
    expect(heatmap.maxValue).toBe(9);

    const total88 = heatmap.cells.find(
      (c) => c.equipe === TODOS && c.milestone_iid === 88,
    );
    expect(total88?.value).toBe(9);

    const naoInformado88 = heatmap.cells.find(
      (c) => c.equipe === "Não informado" && c.milestone_iid === 88,
    );
    expect(naoInformado88?.value).toBe(2);

    const alpha88 = heatmap.cells.find(
      (c) => c.equipe === "Alpha" && c.milestone_iid === 88,
    );
    expect(alpha88?.value).toBe(4);

    const g4f90 = heatmap.cells.find((c) => c.equipe === "G4F" && c.milestone_iid === 90);
    expect(g4f90?.value).toBe(0);
  });
});

describe("milestoneCapacityToLineSeries", () => {
  it("filtra série por equipe", () => {
    const series = milestoneCapacityToLineSeries(sampleRows, "Alpha", "issues");
    expect(series).toHaveLength(2);
    expect(series[0]?.value).toBe(4);
    expect(series[1]?.value).toBe(6);
  });

  it("agrega todas as equipes quando selecionado Todos", () => {
    const series = milestoneCapacityToLineSeries(sampleRows, TODOS, "issues", teamOptions);
    expect(series).toHaveLength(2);
    expect(series[0]?.value).toBe(9);
    expect(series[1]?.value).toBe(7);
  });
});

describe("parseMilestoneCapacityTeam", () => {
  const options = [TODOS, "Alpha", "Beta"];

  it("usa Todos como padrão", () => {
    expect(parseMilestoneCapacityTeam(null, options)).toBe(TODOS);
    expect(parseMilestoneCapacityTeam(undefined, options)).toBe(TODOS);
    expect(parseMilestoneCapacityTeam(TODOS, options)).toBe(TODOS);
  });

  it("aceita equipe válida", () => {
    expect(parseMilestoneCapacityTeam("Beta", options)).toBe("Beta");
  });

  it("volta para Todos quando equipe inválida", () => {
    expect(parseMilestoneCapacityTeam("Inexistente", options)).toBe(TODOS);
  });
});

describe("milestoneCapacityTeamOptions", () => {
  it("mescla opções globais com equipes do intervalo", () => {
    expect(
      milestoneCapacityTeamOptions(
        [TODOS, "Não informado", "FIRST", "G4F"],
        ["Alpha", "G4F"],
      ),
    ).toEqual([TODOS, "Não informado", "Alpha", "FIRST", "G4F"]);
  });
});

describe("milestoneCapacityUniqueTeams", () => {
  it("ordena equipes por volume total", () => {
    expect(milestoneCapacityUniqueTeams(sampleRows)).toEqual(["Alpha", "Beta", "Não informado"]);
  });
});

describe("milestoneCapacityHasStoryPoints", () => {
  it("detecta pontos no intervalo", () => {
    expect(milestoneCapacityHasStoryPoints(sampleRows)).toBe(true);
    expect(
      milestoneCapacityHasStoryPoints([
        { ...sampleRows[0]!, pontos_entregues: 0 },
      ]),
    ).toBe(false);
  });
});

describe("milestoneCapacityHeatmapIntensity", () => {
  it("escala 0–1", () => {
    expect(milestoneCapacityHeatmapIntensity(0, 10)).toBe(0);
    expect(milestoneCapacityHeatmapIntensity(5, 10)).toBe(0.5);
    expect(milestoneCapacityHeatmapIntensity(15, 10)).toBe(1);
  });
});
