import { describe, expect, it } from "vitest";

import {
  isValidSortOrder,
  resolveSortOrder,
  toggleColumnOrder,
} from "@/lib/dashboard/table-sort";
import { PARCERIAS_SORT_COLUMNS, resolveParceriasOrder } from "@/lib/dashboard/parcerias-sort";
import { TODOS } from "@/lib/dashboard/constants";

const SAMPLE_COLUMNS = [
  { key: "a", asc: "a_asc", desc: "a_desc" },
  { key: "b", asc: "b_asc", desc: "b_desc" },
];

describe("table-sort", () => {
  it("alterna desc/asc na primeira interação", () => {
    expect(toggleColumnOrder("a_desc", "b", SAMPLE_COLUMNS)).toBe("b_desc");
    expect(toggleColumnOrder("b_desc", "b", SAMPLE_COLUMNS)).toBe("b_asc");
  });

  it("valida e resolve ordenação desconhecida", () => {
    expect(isValidSortOrder("a_asc", SAMPLE_COLUMNS)).toBe(true);
    expect(isValidSortOrder("invalid", SAMPLE_COLUMNS)).toBe(false);
    expect(resolveSortOrder("invalid", SAMPLE_COLUMNS, "a_desc")).toBe("a_desc");
  });
});

describe("resolveParceriasOrder", () => {
  it("usa padrão por parceria quando order ausente", () => {
    expect(resolveParceriasOrder(null, TODOS)).toBe("parceria_asc");
    expect(resolveParceriasOrder(null, "SEBRAE")).toBe("fechado_em_desc");
  });

  it("aceita order válido de parcerias", () => {
    expect(resolveParceriasOrder("modulo_asc", "SEBRAE")).toBe("modulo_asc");
    expect(
      PARCERIAS_SORT_COLUMNS.some((column) => column.asc === "entrega_prevista_asc"),
    ).toBe(true);
  });
});
