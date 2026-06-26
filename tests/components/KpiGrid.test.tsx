import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiGrid } from "@/components/dashboard/KpiGrid";

describe("KpiGrid", () => {
  it("mostra placeholder quando kpis e null", () => {
    render(<KpiGrid kpis={null} />);
    expect(screen.getByText(/KPIs indisponíveis/)).toBeInTheDocument();
  });

  it("renderiza cards com valores formatados", () => {
    render(
      <KpiGrid
        kpis={{
          total: 1000,
          abertas: 400,
          fechadas: 600,
          taxa_fechamento: 60,
          lead_time_medio: 12.5,
          bugs_abertos: 10,
          melhorias_abertas: 20,
          sem_tipo: 5,
          pct_bugs_backlog: 15.2,
          taxa_fech_bug: 75,
          sla_acima_90: 8,
        }}
      />,
    );

    expect(screen.getByText("Total filtrado")).toBeInTheDocument();
    expect(screen.getByText("1.000")).toBeInTheDocument();
    expect(screen.getByText("60,0%")).toBeInTheDocument();
    expect(screen.getByText("12,5")).toBeInTheDocument();
    expect(screen.getByText("dias")).toBeInTheDocument();
  });

  it("mostra traco quando lead time e null", () => {
    render(
      <KpiGrid
        kpis={{
          total: 10,
          abertas: 5,
          fechadas: 5,
          taxa_fechamento: 50,
          lead_time_medio: null,
          bugs_abertos: 1,
          melhorias_abertas: 2,
          sem_tipo: 0,
          pct_bugs_backlog: 10,
          taxa_fech_bug: 50,
          sla_acima_90: 0,
        }}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
