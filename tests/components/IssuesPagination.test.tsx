import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/issues",
  useSearchParams: () => new URLSearchParams("page=2&q=teste"),
}));

import { IssuesPagination } from "@/components/issues/IssuesPagination";

describe("IssuesPagination", () => {
  it("mostra intervalo e total de paginas", () => {
    render(<IssuesPagination page={2} pageSize={50} total={120} />);

    expect(screen.getByText(/51–100 de 120/)).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("mostra zero quando total e zero", () => {
    render(<IssuesPagination page={1} pageSize={50} total={0} />);
    expect(screen.getByText(/0–0 de 0/)).toBeInTheDocument();
  });

  it("navega para pagina anterior removendo param na pagina 1", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesPagination page={2} pageSize={50} total={120} />);

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(pushMock).toHaveBeenCalledWith("/issues?q=teste");
  });

  it("navega para proxima pagina", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    render(<IssuesPagination page={2} pageSize={50} total={120} />);

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("/issues?");
    expect(url).toContain("page=3");
    expect(url).toContain("q=teste");
  });

  it("desabilita anterior na primeira pagina", () => {
    render(<IssuesPagination page={1} pageSize={50} total={120} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });
});
