import { describe, expect, it } from "vitest";

import {
  fileFingerprint,
  formatFileSize,
  isDryRunResult,
} from "@/components/dados/import/utils";

describe("import utils", () => {
  it("isDryRunResult identifica resposta de validação", () => {
    expect(
      isDryRunResult({
        dry_run: true,
        rows: 2,
        warnings: [],
        sample: [],
      }),
    ).toBe(true);

    expect(
      isDryRunResult({
        processed: 1,
        upserted_issues: 1,
        upserted_milestone_issues: 0,
        not_found_in_issues: 0,
        errors: 0,
        warnings: [],
      }),
    ).toBe(false);
  });

  it("formatFileSize formata bytes, KB e MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("fileFingerprint combina nome, tamanho e lastModified", () => {
    const file = new File(["x"], "planilha.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      lastModified: 123,
    });

    expect(fileFingerprint(file)).toBe("planilha.xlsx:1:123");
  });
});
