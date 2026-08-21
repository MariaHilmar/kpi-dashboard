import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/issues",
  useSearchParams: () =>
    new URLSearchParams(
      "modulo=Fiscalização&estado=open&epico=Não informado&faixaIdade=0-30 dias",
    ),
}));

import { IssuesToolbar } from "@/components/issues/IssuesToolbar";

const autores = ["Todos", "Maria Silva", "João Souza"];
const statuses = ["Todos", "Doing", "Backlog", "Delivered"];

describe("IssuesToolbar", () => {
  const exportHref = "/api/issues/export?modulo=Fiscalização&estado=open";

  it("renderiza busca e filtros com valores da URL", () => {
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);
    expect(screen.getByLabelText(/Buscar issues/)).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toHaveValue("open");
    expect(screen.getByLabelText("Faixa de idade")).toHaveValue("0-30 dias");
    expect(screen.getByLabelText("Autor(a)")).toHaveValue("Todos");
    expect(screen.getByLabelText("Status")).toHaveTextContent("Todos");
  });

  it("envia filtro de autor limpando page", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);

    await user.selectOptions(screen.getByLabelText("Autor(a)"), "Maria Silva");

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("autor=Maria");
    expect(url).not.toContain("page=");
  });

  it("altera filtro SLA", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);

    await user.selectOptions(screen.getByLabelText("SLA"), "acima_90");
    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("sla=acima_90");
  });

  it("adiciona status à seleção (CSV na URL)", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("checkbox", { name: "Em execução" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("status=Doing");
    expect(url).not.toContain("page=");
  });

  it("não exibe filtros de data de criação", () => {
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);
    expect(screen.queryByLabelText("Data inicial de criação")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data final de criação")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aplicar período" })).not.toBeInTheDocument();
  });

  it("exibe link de exportação Excel", () => {
    render(<IssuesToolbar autores={autores} statuses={statuses} exportHref={exportHref} />);
    const link = screen.getByRole("link", { name: "Exportar Excel" });
    expect(link).toHaveAttribute("href", exportHref);
  });
});
