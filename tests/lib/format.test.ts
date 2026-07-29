import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "@/lib/format";

describe("formatDateTime / formatDate", () => {
  it("formata em America/Sao_Paulo (UTC-3) a partir de ISO UTC", () => {
    // 17:46 UTC → 14:46 em São Paulo (horário de Brasília, sem DST desde 2019)
    expect(formatDateTime("2026-07-29T17:46:04.000Z")).toBe("29/07/2026, 14:46:04");
    expect(formatDate("2026-07-29T17:46:04.000Z")).toBe("29/07/2026");
  });

  it("retorna placeholder para vazio ou inválido", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("não-é-data")).toBe("—");
  });
});
