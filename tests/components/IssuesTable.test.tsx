import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/issues",
  useSearchParams: () => new URLSearchParams("order=criado_em_desc"),
}));

import { IssuesTable } from "@/components/issues/IssuesTable";
import type { IssueRow } from "@/lib/dashboard/issues";

const sampleRow: IssueRow = {
  total_count: 1,
  gitlab_iid: 1234,
  gitlab_repo: "contratos_v2",
  titulo: "[PNCP] Integrar envio",
  modulo: "PNCP",
  area_funcional: "PNCP",
  tipo: "Melhoria",
  estado: "open",
  status: "Em andamento",
  prioridade: "high",
  equipe: "Alpha",
  parceria: "Beta",
  sprint: "Sprint 10",
  epico: "Epico 1",
  desenvolvedor: "Dev",
  assignee: "Assignee",
  criado_em: "2024-06-15T12:00:00Z",
  fechado_em: null,
  lead_time_dias: 5,
  idade_dias: 30,
  sla_mais_90_dias: true,
};

describe("IssuesTable", () => {
  it("mostra estado vazio", () => {
    render(<IssuesTable rows={[]} />);
    expect(screen.getByText(/Nenhuma issue encontrada/)).toBeInTheDocument();
  });

  it("renderiza linha com badge aberta e SLA", () => {
    render(<IssuesTable rows={[sampleRow]} />);

    const link = screen.getByRole("link", { name: "1234" });
    expect(link).toHaveAttribute(
      "href",
      "https://gitlab.com/comprasnet/contratos_v2/-/work_items/1234",
    );
    expect(screen.getByText("[PNCP] Integrar envio")).toBeInTheDocument();
    expect(screen.getByText("Aberta")).toBeInTheDocument();
    expect(screen.getByText(/SLA > 90d/)).toBeInTheDocument();
    expect(screen.getByText("PNCP")).toBeInTheDocument();
  });

  it("renderiza issue fechada", () => {
    render(
      <IssuesTable
        rows={[{ ...sampleRow, estado: "closed", sla_mais_90_dias: false }]}
      />,
    );
    expect(screen.getByText("Fechada")).toBeInTheDocument();
  });

  it("renderiza issue aberta com estado em portugues (pipeline)", () => {
    render(
      <IssuesTable
        rows={[{ ...sampleRow, gitlab_iid: 786, estado: "Aberto", sla_mais_90_dias: true }]}
      />,
    );
    expect(screen.getByText("Aberta")).toBeInTheDocument();
    expect(screen.queryByText("Fechada")).not.toBeInTheDocument();
  });
});
