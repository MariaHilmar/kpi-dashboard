import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { rechartsMock } from "../mocks/recharts";

vi.mock("recharts", () => rechartsMock);

import { DonutChartCard } from "@/components/dashboard/DonutChartCard";

describe("DonutChartCard", () => {
  it("mostra vazio quando todas quantidades sao zero", () => {
    render(
      <DonutChartCard
        title="Módulos"
        data={[
          { label: "PNCP", quantidade: 0 },
          { label: "Jobs", quantidade: 0 },
        ]}
      />,
    );
    expect(screen.getByText("Sem dados para exibir.")).toBeInTheDocument();
  });

  it("renderiza grafico filtrando zeros", () => {
    render(
      <DonutChartCard
        title="Módulos"
        data={[
          { label: "PNCP", quantidade: 10 },
          { label: "Vazio", quantidade: 0 },
        ]}
      />,
    );
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });
});
