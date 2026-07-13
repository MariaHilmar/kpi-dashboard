import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImportarDadosPanel } from "@/components/dados/ImportarDadosPanel";
import type { MilestoneOption } from "@/lib/dashboard/milestones";

const milestones: MilestoneOption[] = [
  {
    id: "m1",
    gitlab_milestone_iid: 90,
    titulo: "Sprint 90 - Contratos",
  },
];

describe("ImportarDadosPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza seções principais e colunas da planilha", () => {
    render(<ImportarDadosPanel milestones={milestones} />);

    expect(screen.getByText("Como funciona")).toBeInTheDocument();
    expect(screen.getByText("Enviar planilha")).toBeInTheDocument();
    expect(screen.getByText("Colunas da planilha")).toBeInTheDocument();
    expect(screen.getByText("gitlab_repo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar dados" })).toBeDisabled();
  });

  it("exige validação antes de habilitar importação", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          dry_run: true,
          rows: 1,
          warnings: [],
          sample: [],
        }),
        { status: 200 },
      ),
    );

    const user = userEvent.setup();
    render(<ImportarDadosPanel milestones={milestones} />);

    const file = new File(["a,b"], "dados.csv", { type: "text/csv" });
    const input = document.getElementById("import-file") as HTMLInputElement;
    await user.upload(input, file);

    expect(
      screen.getByText(/Valide a planilha antes de importar/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar dados" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Validar planilha" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/import/planning-poker", expect.any(Object));
    });

    expect(await screen.findByText("Validação concluída")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar dados" })).toBeEnabled();
  });

  it("mostra erro quando validação falha", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Planilha inválida" }), { status: 400 }),
    );

    const user = userEvent.setup();
    render(<ImportarDadosPanel milestones={milestones} />);

    const file = new File(["a,b"], "dados.csv", { type: "text/csv" });
    const input = document.getElementById("import-file") as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Validar planilha" }));

    expect(await screen.findByText("Planilha inválida")).toBeInTheDocument();
  });

  it("importa após validação bem-sucedida", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            dry_run: true,
            rows: 1,
            warnings: [],
            sample: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            processed: 1,
            upserted_issues: 1,
            upserted_milestone_issues: 1,
            not_found_in_issues: 0,
            errors: 0,
            warnings: [],
          }),
          { status: 200 },
        ),
      );

    const user = userEvent.setup();
    render(<ImportarDadosPanel milestones={milestones} />);

    const file = new File(["a,b"], "dados.csv", { type: "text/csv" });
    const input = document.getElementById("import-file") as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Validar planilha" }));

    await screen.findByText("Validação concluída");
    await user.click(screen.getByRole("button", { name: "Importar dados" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Importação concluída")).toBeInTheDocument();
  });
});
