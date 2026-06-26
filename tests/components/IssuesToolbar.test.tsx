import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/issues",
  useSearchParams: () => new URLSearchParams("estado=open&order=criado_em_desc"),
}));

import { IssuesToolbar } from "@/components/issues/IssuesToolbar";

describe("IssuesToolbar", () => {
  it("renderiza busca e filtros com valores da URL", () => {
    render(<IssuesToolbar />);
    expect(screen.getByLabelText(/Buscar issues/)).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por estado da issue")).toHaveValue("open");
    expect(screen.getByLabelText("Ordenar resultados")).toHaveValue("criado_em_desc");
  });

  it("envia busca via select de ordenacao limpando page", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar />);

    await user.selectOptions(screen.getByLabelText("Ordenar resultados"), "id_desc");

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("order=id_desc");
    expect(url).not.toContain("page=");
  });

  it("altera filtro SLA", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesToolbar />);

    await user.selectOptions(screen.getByLabelText("Filtrar por SLA"), "acima_90");
    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("sla=acima_90");
  });
});
