import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LastSyncLabel } from "@/components/layout/LastSyncLabel";

describe("LastSyncLabel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ lastSync: "2026-07-29T20:46:04.000Z" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("exibe timestamp inicial formatado em America/Sao_Paulo", () => {
    render(
      <LastSyncLabel initialLastSync="2026-07-29T17:46:04.000Z" />,
    );
    expect(screen.getByText(/Dados atualizados em/)).toHaveTextContent(
      "Dados atualizados em 29/07/2026, 14:46:04",
    );
  });

  it("atualiza ao focar a janela", async () => {
    render(
      <LastSyncLabel initialLastSync="2026-07-29T17:46:04.000Z" />,
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByText(/20:46:04|17:46:04/)).toBeInTheDocument();
    expect(screen.getByText(/Dados atualizados em/)).toHaveTextContent(
      "Dados atualizados em 29/07/2026, 17:46:04",
    );
  });

  it("omite o rótulo quando não há sync", () => {
    const { container } = render(<LastSyncLabel initialLastSync={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
