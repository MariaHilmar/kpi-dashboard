import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { rechartsMock } from "../mocks/recharts";

vi.mock("recharts", () => rechartsMock);

import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";

describe("FluxoMensalCard", () => {
  it("mostra estado vazio", () => {
    render(<FluxoMensalCard title="Fluxo" data={[]} />);
    expect(screen.getByText("Sem dados temporais.")).toBeInTheDocument();
  });

  it("renderiza grafico composto", () => {
    render(
      <FluxoMensalCard
        title="Fluxo mensal"
        subtitle="Criados vs fechados"
        data={[
          { mes: "2024-01", criados: 10, fechados: 8, backlog_liquido: 2 },
          { mes: "2024-02", criados: 12, fechados: 15, backlog_liquido: -1 },
        ]}
      />,
    );

    expect(screen.getByText("Fluxo mensal")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });
});
