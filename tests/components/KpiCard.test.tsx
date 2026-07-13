import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCard } from "@/components/dashboard/KpiCard";

describe("KpiCard", () => {
  it("renderiza rótulo, valor e hint", () => {
    render(<KpiCard label="Abertas" value={42} hint="Issues em aberto" />);

    expect(screen.getByText("Abertas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Issues em aberto")).toBeInTheDocument();
  });

  it("exibe link de drill-down quando há issuesHref e contagem positiva", () => {
    render(
      <KpiCard
        label="Fechadas"
        value={15}
        issuesHref="/issues?estado=closed"
        issueCount={15}
      />,
    );

    const link = screen.getByRole("link", { name: "Ver issues — Fechadas" });
    expect(link).toHaveAttribute("href", "/issues?estado=closed");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("não exibe link quando issueCount é zero", () => {
    render(
      <KpiCard
        label="SLA"
        value={0}
        issuesHref="/issues?sla=90"
        issueCount={0}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renderiza tendência comparativa", () => {
    render(
      <KpiCard
        label="Throughput"
        value="8"
        trend={{
          kind: "compare",
          direction: "up",
          percent: 12.4,
          sentiment: "positive",
        }}
      />,
    );

    expect(screen.getByText(/▲ \+12% vs período anterior/)).toBeInTheDocument();
  });

  it("renderiza tendência vazia", () => {
    render(
      <KpiCard
        label="Lead time"
        value="—"
        trend={{ kind: "empty", label: "Sem período anterior" }}
      />,
    );

    expect(screen.getByText("Sem período anterior")).toBeInTheDocument();
  });

  it("renderiza link externo para GitLab", () => {
    render(
      <KpiCard
        label="Repositório"
        value="contratos_v2"
        externalHref="https://gitlab.com/comprasnet/contratos_v2"
      />,
    );

    const link = screen.getByRole("link", { name: "Abrir no GitLab: Repositório" });
    expect(link).toHaveAttribute("href", "https://gitlab.com/comprasnet/contratos_v2");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
