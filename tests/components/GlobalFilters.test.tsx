import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
let currentParams = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(currentParams),
}));

import { GlobalFilters } from "@/components/layout/GlobalFilters";
import type { FilterOptions } from "@/types/database";

const options: FilterOptions = {
  modulos: ["Todos", "PNCP", "Empenho", "Fiscalização"],
  areas: ["Todos", "PNCP", "Minuta de Empenho"],
  tipos: ["Todos", "Não informado", "Bug", "Melhoria", "Performance"],
  prioridades: ["Todos", "high"],
  equipes: ["Todos", "Alpha"],
  statuses: ["Todos", "Em andamento"],
  parcerias: ["Todos", "Não informado", "Beta"],
  sprints: ["Todos", "Sprint 10"],
  epicos: [
    "Todos",
    "Não informado",
    "[Fiscalização] Checklist do contrato",
    "[Gestão Contratual] Conta-Depósito",
  ],
  repositorios: ["Todos", "contratos_v2"],
  autores: ["Todos", "Maria Silva"],
  anos: [2024, 2025],
  moduloAreaPairs: [
    { modulo: "PNCP", area: "PNCP" },
    { modulo: "Empenho", area: "Minuta de Empenho" },
  ],
};

describe("GlobalFilters", () => {
  beforeEach(() => {
    currentParams = "";
  });

  it("renderiza filtros com defaults", () => {
    render(<GlobalFilters options={options} />);
    expect(screen.getByText("Filtros globais")).toBeInTheDocument();
    expect(screen.getByLabelText("Módulo")).toHaveValue("Todos");
    expect(screen.getByLabelText("Área funcional")).toHaveValue("Todos");
    expect(screen.getByLabelText("Épico")).toHaveValue("Todos");
  });

  it("limpa filtros ao clicar em Limpar filtros", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("remove modulo incompatible ao selecionar area", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.selectOptions(screen.getByLabelText("Módulo"), "PNCP");
    await user.selectOptions(
      screen.getByLabelText("Área funcional"),
      "Minuta de Empenho",
    );

    expect(pushMock).toHaveBeenCalledTimes(2);
    const url = pushMock.mock.calls[1][0] as string;
    expect(url).toContain("area=Minuta");
    expect(url).not.toContain("modulo=");
  });

  it("remove area incompatible ao selecionar modulo", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.selectOptions(screen.getByLabelText("Área funcional"), "Minuta de Empenho");
    await user.selectOptions(screen.getByLabelText("Módulo"), "PNCP");

    expect(pushMock).toHaveBeenCalledTimes(2);
    const url = pushMock.mock.calls[1][0] as string;
    expect(url).toContain("modulo=PNCP");
    expect(url).not.toContain("area=");
  });

  it("filtra épicos pelo módulo selecionado (prefixo [Módulo])", () => {
    currentParams = "modulo=Fiscalização";
    render(<GlobalFilters options={options} />);

    const epicoSelect = screen.getByLabelText("Épico");
    const labels = Array.from(
      epicoSelect.querySelectorAll("option"),
      (o) => o.textContent,
    );

    expect(labels).toContain("Todos");
    expect(labels).toContain("[Fiscalização] Checklist do contrato");
    expect(labels).not.toContain("[Gestão Contratual] Conta-Depósito");
  });

  it("remove épico incompatível ao trocar de módulo", async () => {
    pushMock.mockClear();
    currentParams = "epico=%5BGest%C3%A3o+Contratual%5D+Conta-Dep%C3%B3sito";
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.selectOptions(screen.getByLabelText("Módulo"), "Fiscalização");

    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("modulo=Fiscaliza");
    expect(url).not.toContain("epico=");
  });

  it("adiciona um tipo à seleção existente (CSV na URL)", async () => {
    pushMock.mockClear();
    currentParams = "tipo=Bug";
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.click(screen.getByRole("button", { name: "Tipo" }));
    await user.click(screen.getByRole("checkbox", { name: "Melhoria" }));

    const url = pushMock.mock.calls.at(-1)?.[0] as string;
    // vírgula pode vir codificada como %2C na query string
    expect(decodeURIComponent(url)).toContain("tipo=Bug,Melhoria");
  });

  it("marca Bug como selecionado quando presente na URL", async () => {
    currentParams = "tipo=Bug";
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.click(screen.getByRole("button", { name: "Tipo" }));
    expect(screen.getByRole("checkbox", { name: "Bug" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Melhoria" })).not.toBeChecked();
  });

  it("atualiza URL ao selecionar sprint", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    await user.selectOptions(screen.getByLabelText("Sprint"), "Sprint 10");

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("sprint=Sprint"));
  });

  it("exibe resumo do período selecionado na tela com o trecho em destaque", () => {
    currentParams =
      "periodoTipo=fechamento&periodoDe=2026-06-01&periodoAte=2026-06-30";
    render(<GlobalFilters options={options} />);

    const strong = screen.getByText("fechamento de 01/06/2026 a 30/06/2026");
    expect(strong).toBeInTheDocument();
    expect(strong.tagName).toBe("STRONG");
    expect(screen.getByText(/Dados por data de/)).toBeInTheDocument();
  });

  it("botão [alterar data] abre o popup de período", async () => {
    currentParams =
      "periodoTipo=fechamento&periodoDe=2026-06-01&periodoAte=2026-06-30";
    const user = userEvent.setup();
    render(<GlobalFilters options={options} />);

    expect(screen.queryByRole("dialog", { name: "Filtro de período" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alterar data" }));
    expect(screen.getByRole("dialog", { name: "Filtro de período" })).toBeInTheDocument();
  });

  it("evento externo abre o popup de período", async () => {
    currentParams =
      "periodoTipo=merge&periodoDe=2026-02-01&periodoAte=2026-07-29";
    render(<GlobalFilters options={options} />);

    expect(screen.queryByRole("dialog", { name: "Filtro de período" })).not.toBeInTheDocument();
    const { requestOpenPeriodFilter } = await import("@/lib/dashboard/period-filter");
    requestOpenPeriodFilter();
    expect(await screen.findByRole("dialog", { name: "Filtro de período" })).toBeInTheDocument();
  });
});
