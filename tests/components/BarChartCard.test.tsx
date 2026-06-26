import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { rechartsMock } from "../mocks/recharts";

vi.mock("recharts", () => rechartsMock);

import { BarChartCard } from "@/components/dashboard/BarChartCard";

describe("BarChartCard", () => {
  it("mostra estado vazio", () => {
    render(<BarChartCard title="Por tipo" data={[]} emptyMessage="Sem tipos" />);
    expect(screen.getByText("Sem tipos")).toBeInTheDocument();
  });

  it("renderiza grafico com dados", () => {
    render(
      <BarChartCard
        title="Por tipo"
        subtitle="Distribuição"
        data={[
          { label: "Bug", quantidade: 12 },
          { label: "Melhoria", quantidade: 8 },
        ]}
        horizontal
      />,
    );

    expect(screen.getByText("Por tipo")).toBeInTheDocument();
    expect(screen.getByText("Distribuição")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });
});
