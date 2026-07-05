import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertasPorModuloTabela } from "@/components/dashboard/tables/AlertasPorModuloTabela";
import { FaixaIdadeTabela } from "@/components/dashboard/tables/FaixaIdadeTabela";
import { KpisPorTipoTabela } from "@/components/dashboard/tables/KpisPorTipoTabela";
import { TopLeadTimesTabela } from "@/components/dashboard/tables/TopLeadTimesTabela";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";

describe("tabelas do dashboard", () => {
  it("AlertasPorModuloTabela formata percentual", () => {
    render(
      <AlertasPorModuloTabela
        title="Sem épico"
        dimensao="sem_epico"
        filters={DEFAULT_FILTERS}
        rows={[{ modulo: "PNCP", qtde: 5, percentual: 33.333 }]}
      />,
    );
    expect(screen.getByText("Sem épico")).toBeInTheDocument();
    expect(screen.getByText("33.3%")).toBeInTheDocument();
  });

  it("FaixaIdadeTabela renderiza faixas", () => {
    render(
      <FaixaIdadeTabela
        filters={DEFAULT_FILTERS}
        rows={[{ faixa: "0-30 dias", qtde: 20, percentual: 40 }]}
      />,
    );
    expect(screen.getByText("0-30 dias")).toBeInTheDocument();
    expect(screen.getByText("40.0%")).toBeInTheDocument();
  });

  it("KpisPorTipoTabela formata lead time nulo", () => {
    render(
      <KpisPorTipoTabela
        filters={DEFAULT_FILTERS}
        rows={[
          {
            tipo: "Bug",
            total: 10,
            abertas: 4,
            fechadas: 6,
            taxa_fechamento: 60,
            lead_medio: null,
            lead_mediano: 12.5,
          },
        ]}
      />,
    );
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("12,5")).toBeInTheDocument();
  });

  it("TopLeadTimesTabela formata datas", () => {
    render(
      <TopLeadTimesTabela
        rows={[
          {
            id: 100,
            titulo: "Issue longa",
            modulo: "PNCP",
            area: "PNCP",
            estado: "closed",
            status: "Concluído",
            prioridade: "high",
            equipe: "Alpha",
            criado_em: "2024-01-15T00:00:00Z",
            fechado_em: null,
            lead_time: 120,
          },
        ]}
      />,
    );
    expect(screen.getByText("Issue longa")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});
