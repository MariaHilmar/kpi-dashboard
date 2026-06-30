import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SystemFeedback } from "@/components/ui/SystemFeedback";

describe("SystemFeedback", () => {
  it("renderiza mensagem gov.br com titulo padrao", () => {
    render(<SystemFeedback variant="success" message="Operação concluída." />);

    expect(screen.getByRole("alert")).toHaveClass("br-message", "success");
    expect(screen.getByText("Sucesso.")).toBeInTheDocument();
    expect(screen.getByText(/Operação concluída\./)).toBeInTheDocument();
  });

  it("renderiza feedback contextual inline", () => {
    render(<SystemFeedback variant="danger" mode="inline" message="Campo obrigatório." />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("feedback", "danger");
    expect(alert).toHaveTextContent("Campo obrigatório.");
  });

  it("permite fechar mensagem quando onDismiss informado", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <SystemFeedback variant="info" message="Dica de preenchimento." onDismiss={onDismiss} />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar mensagem" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
