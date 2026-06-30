import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

describe("createServerSupabase / isSupabaseConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("isSupabaseConfigured retorna false sem env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { isSupabaseConfigured } = await import("@/lib/supabase/server");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("isSupabaseConfigured retorna true com env completa", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    const { isSupabaseConfigured } = await import("@/lib/supabase/server");
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("createServerSupabase retorna null sem credenciais", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { createServerSupabase } = await import("@/lib/supabase/server");
    expect(await createServerSupabase()).toBeNull();
  });

  it("createServerSupabase retorna cliente quando configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-test");
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const client = await createServerSupabase();
    expect(client).not.toBeNull();
    expect(typeof client?.rpc).toBe("function");
  });

  it("createStaticSupabase retorna cliente quando configurado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-test");
    const { createStaticSupabase } = await import("@/lib/supabase/server");
    const client = createStaticSupabase();
    expect(client).not.toBeNull();
    expect(typeof client?.rpc).toBe("function");
  });
});

describe("auth env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("isAuthRequired true por padrao", async () => {
    const { isAuthRequired } = await import("@/lib/supabase/env");
    expect(isAuthRequired()).toBe(true);
  });

  it("isAuthRequired false quando env desligada", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_REQUIRED", "false");
    const { isAuthRequired } = await import("@/lib/supabase/env");
    expect(isAuthRequired()).toBe(false);
  });

  it("isSignupAllowed false por padrao", async () => {
    const { isSignupAllowed } = await import("@/lib/supabase/env");
    expect(isSignupAllowed()).toBe(false);
  });
});
