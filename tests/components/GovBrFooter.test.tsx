import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovBrFooter } from "@/components/layout/GovBrFooter";

describe("GovBrFooter", () => {
  it("renderiza textos do rodape", () => {
    render(<GovBrFooter />);
    expect(screen.getByText(/Painel interno de gestão/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.2\.0/)).toBeInTheDocument();
  });
});
