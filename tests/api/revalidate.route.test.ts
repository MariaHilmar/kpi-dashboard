import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTagMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

import { POST } from "@/app/api/revalidate/route";
import { CACHE_TAG_KPIS } from "@/lib/dashboard/cache";

describe("POST /api/revalidate", () => {
  const originalSecret = process.env.REVALIDATE_SECRET;

  beforeEach(() => {
    revalidateTagMock.mockClear();
    process.env.REVALIDATE_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.REVALIDATE_SECRET = originalSecret;
  });

  it("retorna 500 quando REVALIDATE_SECRET não está configurado", async () => {
    delete process.env.REVALIDATE_SECRET;

    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("retorna 401 sem Bearer token válido", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("retorna 401 com token incorreto", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: "Bearer wrong" },
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("invalida cache com token correto", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      revalidated: true,
      tag: CACHE_TAG_KPIS,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(CACHE_TAG_KPIS, "max");
  });
});
