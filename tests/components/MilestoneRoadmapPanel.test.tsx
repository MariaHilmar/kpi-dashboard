import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { rechartsMock } from "../mocks/recharts";

const pushParamsMock = vi.fn();

vi.mock("@/hooks/useMilestoneUrlParams", () => ({
  useMilestoneUrlParams: () => ({ pushParams: pushParamsMock, isPending: false }),
}));

vi.mock("recharts", () => rechartsMock);

import { MilestoneRoadmapPanel } from "@/components/dashboard/milestone/MilestoneRoadmapPanel";
import type { MilestoneOption } from "@/lib/dashboard/milestone-options";
import type { MilestoneRoadmapRow } from "@/lib/dashboard/milestone-roadmap";

const milestones: MilestoneOption[] = [
  { id: "1", gitlab_milestone_iid: 88, titulo: "Sprint 88" },
  { id: "2", gitlab_milestone_iid: 90, titulo: "Sprint 90" },
];

const sampleRows: MilestoneRoadmapRow[] = [
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    milestone_start_date: "2025-10-01",
    milestone_due_date: "2025-10-14",
    label: "PNCP",
    rank_in_sprint: 1,
    entregues: 5,
    pontos_entregues: 21,
  },
  {
    milestone_iid: 88,
    milestone_titulo: "Sprint 88",
    milestone_start_date: "2025-10-01",
    milestone_due_date: "2025-10-14",
    label: "Contratos",
    rank_in_sprint: 2,
    entregues: 3,
    pontos_entregues: 13,
  },
  {
    milestone_iid: 90,
    milestone_titulo: "Sprint 90",
    milestone_start_date: "2025-11-01",
    milestone_due_date: "2025-11-14",
    label: "PNCP",
    rank_in_sprint: 1,
    entregues: 4,
    pontos_entregues: 18,
  },
];

describe("MilestoneRoadmapPanel", () => {
  it("renderiza cabeçalho, filtros e timeline", () => {
    render(
      <MilestoneRoadmapPanel
        milestones={milestones}
        fromIid={88}
        toIid={90}
        groupBy="modulo"
        metric="pontos"
        topN={5}
        selectedLabel="PNCP"
        rows={sampleRows}
        hasStoryPoints
      />,
    );

    expect(screen.getByText("Roadmap por sprint")).toBeInTheDocument();
    expect(screen.getByLabelText("Sprint inicial")).toHaveValue("88");
    expect(screen.getByLabelText("Sprint final")).toHaveValue("90");
    expect(screen.getByText("Sprint 88")).toBeInTheDocument();
    expect(screen.getByText("Sprint 90")).toBeInTheDocument();
    expect(screen.getByText("Tendência: PNCP")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("mostra estado vazio sem entregas", () => {
    render(
      <MilestoneRoadmapPanel
        milestones={milestones}
        fromIid={88}
        toIid={90}
        groupBy="modulo"
        metric="issues"
        topN={5}
        selectedLabel={null}
        rows={[]}
        hasStoryPoints={false}
      />,
    );

    expect(screen.getByText("Sem entregas no intervalo selecionado.")).toBeInTheDocument();
  });

  it("alerta quando métrica é pontos sem story points importados", () => {
    render(
      <MilestoneRoadmapPanel
        milestones={milestones}
        fromIid={88}
        toIid={90}
        groupBy="modulo"
        metric="pontos"
        topN={5}
        selectedLabel="PNCP"
        rows={sampleRows.map((row) => ({ ...row, pontos_entregues: 0 }))}
        hasStoryPoints={false}
      />,
    );

    expect(screen.getByText(/Nenhum story point importado/i)).toBeInTheDocument();
  });

  it("seleciona módulo na timeline e atualiza URL", async () => {
    pushParamsMock.mockClear();
    const user = userEvent.setup();

    render(
      <MilestoneRoadmapPanel
        milestones={milestones}
        fromIid={88}
        toIid={90}
        groupBy="modulo"
        metric="issues"
        topN={5}
        selectedLabel={null}
        rows={sampleRows}
        hasStoryPoints
      />,
    );

    await user.click(screen.getByRole("button", { name: /Contratos/i }));

    expect(pushParamsMock).toHaveBeenCalledWith({ roadmapLabel: "Contratos" });
  });
});
