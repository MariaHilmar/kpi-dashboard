import { describe, expect, it } from "vitest";

import { parseIssuesListParams } from "@/lib/dashboard/issues-page-params";

describe("parseIssuesListParams", () => {
  it("lê fechadoDe/fechadoAte e mergeadoDe/mergeadoAte da query string", () => {
    const params = new URLSearchParams({
      fechadoDe: "2026-01-06",
      fechadoAte: "2026-01-17",
      mergeadoDe: "2026-02-01",
      mergeadoAte: "2026-02-28",
    });

    const { list } = parseIssuesListParams(params);

    expect(list.fechadoDe).toBe("2026-01-06");
    expect(list.fechadoAte).toBe("2026-01-17");
    expect(list.mergeadoDe).toBe("2026-02-01");
    expect(list.mergeadoAte).toBe("2026-02-28");
  });
});
