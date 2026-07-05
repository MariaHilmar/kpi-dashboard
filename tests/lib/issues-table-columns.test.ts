import { describe, expect, it } from "vitest";

import {
  ISSUES_OPTIONAL_COLUMNS,
  parseIssuesTableColumns,
  serializeIssuesTableColumns,
} from "@/lib/dashboard/issues-table-columns";

describe("issues-table-columns", () => {
  it("retorna vazio sem param cols", () => {
    expect(parseIssuesTableColumns(null)).toEqual([]);
    expect(parseIssuesTableColumns("")).toEqual([]);
  });

  it("parseia e deduplica colunas válidas", () => {
    expect(parseIssuesTableColumns("story_points,aceita,story_points,invalid")).toEqual([
      "story_points",
      "aceita",
    ]);
  });

  it("serializa colunas visíveis", () => {
    expect(serializeIssuesTableColumns(["story_points", "homologado"])).toBe(
      "story_points,homologado",
    );
  });

  it("lista todas as colunas opcionais conhecidas", () => {
    expect(ISSUES_OPTIONAL_COLUMNS.length).toBeGreaterThanOrEqual(4);
    expect(ISSUES_OPTIONAL_COLUMNS.some((column) => column.key === "story_points")).toBe(true);
  });
});
