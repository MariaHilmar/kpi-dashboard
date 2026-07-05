import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabelaCard } from "@/components/dashboard/TabelaCard";

type Row = { nome: string; qtde: number };

describe("TabelaCard", () => {
  it("mostra mensagem vazia", () => {
    render(
      <TabelaCard<Row>
        title="Teste"
        columns={[{ key: "nome", header: "Nome" }]}
        rows={[]}
        emptyMessage="Nada aqui"
      />,
    );
    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
  });

  it("renderiza colunas e linhas com render customizado", () => {
    render(
      <TabelaCard<Row>
        title="Ranking"
        subtitle="Top items"
        columns={[
          { key: "nome", header: "Nome" },
          {
            key: "qtde",
            header: "Qtde",
            align: "right",
            render: (row) => `${row.qtde} itens`,
          },
        ]}
        rows={[
          { nome: "PNCP", qtde: 10 },
          { nome: "Empenho", qtde: 5 },
        ]}
      />,
    );

    expect(screen.getByText("Ranking")).toBeInTheDocument();
    expect(screen.getByText("Top items")).toBeInTheDocument();
    expect(screen.getByText("PNCP")).toBeInTheDocument();
    expect(screen.getByText("10 itens")).toBeInTheDocument();
  });

  it("aplica altura maxima e rolagem quando bodyMaxHeight e informado", () => {
    const { container } = render(
      <TabelaCard<Row>
        title="Ranking"
        columns={[{ key: "nome", header: "Nome" }]}
        rows={[{ nome: "PNCP", qtde: 10 }]}
        bodyMaxHeight="max-h-80"
      />,
    );

    const scrollArea = container.querySelector(".max-h-80.overflow-y-auto");
    expect(scrollArea).toBeInTheDocument();
    expect(container.querySelector("thead.sticky")).toBeInTheDocument();
  });
});
