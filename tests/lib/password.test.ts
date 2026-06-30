import { describe, expect, it } from "vitest";

import { validatePasswordPair } from "@/lib/auth/password";

describe("validatePasswordPair", () => {
  it("aceita senhas iguais com 6+ caracteres", () => {
    expect(validatePasswordPair("abc123", "abc123")).toBeNull();
  });

  it("rejeita senha curta", () => {
    expect(validatePasswordPair("12345", "12345")).toMatch(/6 caracteres/);
  });

  it("rejeita senhas diferentes", () => {
    expect(validatePasswordPair("abc123", "abc124")).toMatch(/não coincidem/);
  });
});
