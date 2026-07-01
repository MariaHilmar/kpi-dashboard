import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => import("../mocks/next-image"));

import { GovBrFooter } from "@/components/layout/GovBrFooter";

describe("GovBrFooter", () => {
  it("renderiza marca e textos institucionais", () => {
    render(<GovBrFooter />);
    expect(screen.getByAltText("gov.br")).toBeInTheDocument();
    expect(
      screen.getByText(/Ministério da Gestão e da Inovação/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Painel interno de gestão/)).toBeInTheDocument();
    expect(screen.getByText(/v0\.2\.0/)).toBeInTheDocument();
  });
});
