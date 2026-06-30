import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

import { GlobalFilters } from "@/components/layout/GlobalFilters";
import type { FilterOptions } from "@/types/database";

const options: FilterOptions = {
  modulos: ["Todos", "PNCP", "Empenho"],
  areas: ["Todos", "PNCP", "Minuta de Empenho"],
  tipos: ["Todos", "Bug"],
  prioridades: ["Todos", "high"],
  equipes: ["Todos", "Alpha"],
  statuses: ["Todos", "Em andamento"],
  parcerias: ["Todos", "Beta"],
  sprints: ["Todos", "Sprint 10"],
  epicos: ["Todos", "Epico 1"],
  repositorios: ["Todos", "contratos_v2"],
  autores: ["Todos", "Maria Silva"],
  anos: [2024, 2025],
  moduloAreaPairs: [
    { modulo: "PNCP", area: "PNCP" },
    { modulo: "Empenho", area: "Minuta de Empenho" },
  ],
};

describe("GlobalFilters", () => {
  it("renderiza filtros com defaults", () => {
    render(<GlobalFilters options={options} />);
    expect(screen.getByText("Filtros globais")).toBeInTheDocument();
    expect(screen.getByLabelText("Módulo")).toHaveValue("Todos");
    expect(screen.getByLabelText("Área funcional")).toHaveValue("Todos");
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
});
