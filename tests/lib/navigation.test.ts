import { describe, expect, it } from "vitest";

import { buildNavHref, filterNavGroups, isLocalhostOrigin, isNavItemActive, NAV_GROUPS } from "@/lib/navigation";

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

describe("isLocalhostOrigin", () => {
  it("reconhece localhost e 127.0.0.1", () => {
    expect(isLocalhostOrigin("localhost")).toBe(true);
    expect(isLocalhostOrigin("127.0.0.1")).toBe(true);
    expect(isLocalhostOrigin("app.example.com")).toBe(false);
  });
});

describe("filterNavGroups", () => {
  it("oculta páginas desativadas (fluxo, milestone, roadmap, equipes, sprint)", () => {
    const filtered = filterNavGroups(NAV_GROUPS, true);
    const hrefs = filtered.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).not.toContain("/fluxo");
    expect(hrefs).not.toContain("/milestone");
    expect(hrefs).not.toContain("/milestone/roadmap");
    expect(hrefs).not.toContain("/equipes");
    expect(hrefs).not.toContain("/sprint");
  });

  it("oculta itens localhostOnly fora de localhost", () => {
    const filtered = filterNavGroups(NAV_GROUPS, false);
    const hrefs = filtered.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).not.toContain("/milestone/roadmap");
  });
});
