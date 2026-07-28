import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const replaceStateMock = vi.fn();
let currentParams = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(currentParams),
}));

vi.mock("recharts", () => import("../mocks/recharts").then((mod) => mod.rechartsMock));

import { FluxoMensalCard } from "@/components/dashboard/FluxoMensalCard";

const data = Array.from({ length: 18 }, (_, index) => {
  const month = String(index + 1).padStart(2, "0");
  return {
    mes: `2024/${month}`,
    criados: index + 1,
    fechados: index,
    backlog_liquido: index + 1,
    mergeadas: 0,
  };
});

describe("FluxoMensalCard", () => {
  beforeEach(() => {
    currentParams = "";
    pushMock.mockClear();
    replaceStateMock.mockClear();
    vi.spyOn(window.history, "replaceState").mockImplementation(replaceStateMock);
  });

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
          { mes: "2024-01", criados: 10, fechados: 8, backlog_liquido: 2, mergeadas: 3 },
          { mes: "2024-02", criados: 12, fechados: 15, backlog_liquido: -1, mergeadas: 5 },
        ]}
      />,
    );

    expect(screen.getByText("Fluxo mensal")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("exibe radios de janela temporal sem opção de 1 mês", () => {
    render(<FluxoMensalCard title="Evolução mensal" data={data} />);

    expect(screen.queryByRole("radio", { name: "1 mês" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "6 meses" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1 ano" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2 anos" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "6 meses" })).toBeChecked();
  });

  it("atualiza URL sem navegar ao trocar janela", async () => {
    const user = userEvent.setup();
    render(<FluxoMensalCard title="Evolução mensal" data={data} />);

    await user.click(screen.getByRole("radio", { name: "1 ano" }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceStateMock).toHaveBeenCalledWith(null, "", "/?evolucaoJanela=1y");
    expect(screen.getByRole("radio", { name: "1 ano" })).toBeChecked();
  });

  it("usa default quando URL legada pede 1 mês", () => {
    currentParams = "evolucaoJanela=1m";
    render(<FluxoMensalCard title="Evolução mensal" data={data} />);

    expect(screen.getByRole("radio", { name: "6 meses" })).toBeChecked();
  });

  it("mantém backlog líquido no gráfico", () => {
    render(
      <FluxoMensalCard
        title="Evolução mensal"
        data={[
          { mes: "2026/07", criados: 10, fechados: 8, backlog_liquido: 2, mergeadas: 3 },
        ]}
      />,
    );

    expect(screen.getByTestId("area")).toBeInTheDocument();
  });
});
