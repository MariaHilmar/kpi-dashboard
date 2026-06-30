import { afterEach, describe, expect, it, vi } from "vitest";

import {
  autorForSnapshot,
  currentAnoMes,
  formatAnoMesLabel,
  formatAnoMesPeriodoLabel,
  listRecentAnoMesOptions,
  normalizeAnoMes,
  normalizeSprintParam,
  resolveAutorQueryParam,
} from "@/lib/dashboard/analistas-utils";
import { TODOS } from "@/lib/dashboard/constants";

afterEach(() => {
  vi.useRealTimers();
});

describe("analistas helpers", () => {
  it("normaliza ano-mes com hífen", () => {
    expect(normalizeAnoMes("2026-05")).toBe("2026/05");
  });

  it("mantém ano-mes já normalizado", () => {
    expect(normalizeAnoMes("2026/05")).toBe("2026/05");
  });

  it("formata rótulo MM/AAAA", () => {
    expect(formatAnoMesLabel("2026/05")).toBe("05/2026");
  });

  it("formata período por extenso para relatórios", () => {
    expect(formatAnoMesPeriodoLabel("2026/06")).toBe("Junho/2026");
    expect(formatAnoMesPeriodoLabel("2026-03")).toBe("Março/2026");
  });

  it("gera ano-mes atual", () => {
    expect(currentAnoMes()).toMatch(/^\d{4}\/\d{2}$/);
  });

  it("normaliza sprint vazio para todos", () => {
    expect(normalizeSprintParam("Todos")).toBe("");
    expect(normalizeSprintParam("Sprint 89 - Contratos")).toBe("Sprint 89 - Contratos");
  });

  it("lista meses recentes sem duplicatas (dia 31 do mes)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T12:00:00"));

    const options = listRecentAnoMesOptions(18);
    expect(new Set(options).size).toBe(options.length);
    expect(options[0]).toBe("2026/03");
    expect(options[1]).toBe("2026/02");

    vi.useRealTimers();
  });

  it("resolve autor da URL ou perfil logado", () => {
    expect(resolveAutorQueryParam("Maria Hilmar", null)).toBe("Maria Hilmar");
    expect(resolveAutorQueryParam(undefined, "Maria Hilmar")).toBe("Maria Hilmar");
    expect(resolveAutorQueryParam(undefined, null)).toBe(TODOS);
  });

  it("converte autor da URL para filtro da RPC", () => {
    expect(autorForSnapshot(TODOS)).toBeNull();
    expect(autorForSnapshot("Maria Hilmar")).toBe("Maria Hilmar");
  });
});
