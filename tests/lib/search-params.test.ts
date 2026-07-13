import { describe, expect, it } from "vitest";

import { readSearchParam } from "@/lib/dashboard/search-params";

describe("readSearchParam", () => {
  it("retorna string direta", () => {
    expect(readSearchParam("pontos")).toBe("pontos");
  });

  it("retorna primeiro item de array", () => {
    expect(readSearchParam(["a", "b"])).toBe("a");
  });

  it("retorna null para undefined ou array vazio", () => {
    expect(readSearchParam(undefined)).toBeNull();
    expect(readSearchParam([])).toBeNull();
  });
});
