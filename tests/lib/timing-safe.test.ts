import { describe, expect, it } from "vitest";

import { timingSafeEqualString } from "@/lib/auth/timing-safe";

describe("timingSafeEqualString", () => {
  it("retorna true para strings iguais", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
  });

  it("retorna false para strings diferentes", () => {
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
  });

  it("retorna false para comprimentos diferentes", () => {
    expect(timingSafeEqualString("short", "longer-value")).toBe(false);
  });
});
