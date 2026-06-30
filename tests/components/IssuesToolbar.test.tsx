import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/issues",
  useSearchParams: () => new URLSearchParams("estado=open&order=criado_em_desc"),
}));

import { IssuesToolbar } from "@/components/issues/IssuesToolbar";

const autores = ["Todos", "Maria Silva", "João Souza"];

describe("IssuesToolbar", () => {
  it("renderiza busca e filtros com valores da URL", () => {
    render(<IssuesToolbar autores={autores} />);
    expect(screen.getByLabelText(/Buscar issues/)).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado da issue")).toHaveValue("open");
    expect(screen.getByLabelText("Filtrar por autor da issue")).toHaveValue("Todos");
  });

  it("envia filtro de autor limpando page", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} />);

    await user.selectOptions(screen.getByLabelText("Filtrar por autor da issue"), "Maria Silva");

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("autor=Maria");
    expect(url).not.toContain("page=");
  });

  it("altera filtro SLA", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} />);

    await user.selectOptions(screen.getByLabelText("Filtrar por SLA"), "acima_90");
    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("sla=acima_90");
  });

  it("aplica período de datas", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar autores={autores} />);

    fireEvent.change(screen.getByLabelText("Data inicial de criação"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Data final de criação"), {
      target: { value: "2024-12-31" },
    });
    await user.click(screen.getByRole("button", { name: "Aplicar período" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("criadoDe=2024-01-01");
    expect(url).toContain("criadoAte=2024-12-31");
  });
});
