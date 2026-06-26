import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SetupBanner } from "@/components/dashboard/SetupBanner";

describe("SetupBanner", () => {
  it("renderiza mensagem padrao", () => {
    render(<SetupBanner />);
    expect(screen.getByText("Configuração / sync pendente")).toBeInTheDocument();
    expect(screen.getByText(/Copie web\/\.env\.local\.example/)).toBeInTheDocument();
  });

  it("renderiza mensagem customizada", () => {
    render(<SetupBanner message="Supabase offline" />);
    expect(screen.getByText("Supabase offline")).toBeInTheDocument();
  });
});
