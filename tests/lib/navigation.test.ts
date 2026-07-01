import { describe, expect, it } from "vitest";

import { buildNavHref, isNavItemActive } from "@/lib/navigation";

describe("buildNavHref", () => {
  it("preserva query string em rotas comuns", () => {
    expect(buildNavHref("/detalhamento", "modulo=PNCP&sprint=Sprint+90")).toBe(
      "/detalhamento?modulo=PNCP&sprint=Sprint+90",
    );
  });

  it("remove sprint ao navegar para a pagina Sprint Atual", () => {
    expect(buildNavHref("/sprint", "modulo=PNCP&sprint=Todos")).toBe("/sprint?modulo=PNCP");
    expect(buildNavHref("/sprint", "sprint=Sprint+89+-+Contratos")).toBe("/sprint");
  });

  it("retorna href limpo sem query", () => {
    expect(buildNavHref("/sprint", "")).toBe("/sprint");
  });
});

describe("isNavItemActive", () => {
  it("marca sprint como ativa no prefixo", () => {
    expect(isNavItemActive("/sprint", "/sprint")).toBe(true);
  });
});
