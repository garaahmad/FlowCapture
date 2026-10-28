import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../lib/api";

describe("API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the same-origin backend and JSON content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200, headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiFetch("/example", { method: "POST", body: "{}" })).resolves.toEqual({ data: { ok: true } });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/backend/example");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
    expect(init.credentials).toBe("same-origin");
  });

  it("preserves safe server error codes and request IDs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "AUTH_REQUIRED", message: "Sign in", requestId: "request-1" },
    }), { status: 401 })));
    const error = await apiFetch("/me").catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "AUTH_REQUIRED", requestId: "request-1" });
  });
});
