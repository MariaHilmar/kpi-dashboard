import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/PageHeader";

describe("PageHeader", () => {
  it("renderiza titulo e subtitulo", () => {
    render(<PageHeader title="Dashboard" subtitle="Visão geral" />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Visão geral")).toBeInTheDocument();
  });

  it("mostra ultima sincronizacao quando informada", () => {
    render(
      <PageHeader
        title="Dashboard"
        lastSync="2024-06-15T14:30:00.000Z"
      />,
    );
    expect(screen.getByText(/Última sincronização:/)).toBeInTheDocument();
  });

  it("omite subtitulo e sync quando ausentes", () => {
    render(<PageHeader title="Issues" />);
    expect(screen.queryByText(/Última sincronização/)).not.toBeInTheDocument();
  });
});
