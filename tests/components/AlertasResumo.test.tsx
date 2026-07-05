import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertasResumo } from "@/components/dashboard/AlertasResumo";
import { DEFAULT_FILTERS } from "@/lib/dashboard/filters";

describe("AlertasResumo", () => {
  it("nao renderiza quando data e null", () => {
    const { container } = render(<AlertasResumo data={null} filters={DEFAULT_FILTERS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza cards com valores formatados", () => {
    render(
      <AlertasResumo
        data={{ abertas: 1500, sem_epico: 42, sem_parceria: 7 }}
        filters={DEFAULT_FILTERS}
      />,
    );

    expect(screen.getByText("Issues Abertas")).toBeInTheDocument();
    expect(screen.getByText("1.500")).toBeInTheDocument();
    expect(screen.getByText("Issues sem épicos definidos")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Issues sem parcerias definidas")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
