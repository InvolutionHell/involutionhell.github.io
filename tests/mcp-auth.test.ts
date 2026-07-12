import { afterEach, describe, expect, it, vi } from "vitest";
import { protectMcpHandler, verifyToken } from "@/lib/mcp/auth";

const request = new Request("https://involutionhell.com/api/mcp");

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BACKEND_URL;
});

describe("MCP token verification", () => {
  it("validates a satoken and returns MCP auth info", async () => {
    process.env.BACKEND_URL = "https://backend.example";
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ data: { id: 42, username: "alice" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const authInfo = await verifyToken(request, "secret-token");

    expect(fetchMock).toHaveBeenCalledWith("https://backend.example/auth/me", {
      headers: { satoken: "secret-token" },
      signal: expect.any(AbortSignal),
    });
    expect(authInfo).toMatchObject({
      clientId: "involutionhell-user:42",
      scopes: ["publish"],
      extra: { user: { id: 42, username: "alice" } },
    });
  });

  it.each([401, 403])("returns undefined for a backend %i", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status })),
    );

    await expect(
      verifyToken(request, "expired-token"),
    ).resolves.toBeUndefined();
  });

  it("propagates a network failure to the auth wrapper", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new Error("network unavailable")),
    );

    await expect(verifyToken(request, "secret-token")).rejects.toThrow(
      "network unavailable",
    );
  });

  it("does not call the backend when no bearer token is present", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyToken(request)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not verify bearer tokens for non-publish requests", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const handler = vi.fn(() => Response.json({ ok: true }));
    const protectedHandler = protectMcpHandler(handler);
    const bearerRequest = new Request(request, {
      method: "POST",
      headers: { authorization: "Bearer bogus" },
    });

    const response = await protectedHandler(bearerRequest, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the same 401 challenge for missing and invalid publish tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 401 })),
    );
    const protectedHandler = protectMcpHandler(() =>
      Response.json({ ok: true }),
    );
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "publish", arguments: {} },
    };
    const missing = await protectedHandler(
      new Request(request, { method: "POST" }),
      body,
    );
    const invalid = await protectedHandler(
      new Request(request, {
        method: "POST",
        headers: { authorization: "Bearer bogus" },
      }),
      body,
    );

    expect(invalid.status).toBe(401);
    expect(invalid.headers.get("www-authenticate")).toBe(
      missing.headers.get("www-authenticate"),
    );
  });

  it.each([
    [
      "HTTP 500",
      () => Promise.resolve(new Response("backend secret", { status: 500 })),
    ],
    [
      "timeout",
      () => Promise.reject(new DOMException("timed out", "TimeoutError")),
    ],
  ])(
    "returns 503 without backend details on auth %s",
    async (_case, fetchResult) => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockImplementation(fetchResult),
      );
      const protectedHandler = protectMcpHandler(() =>
        Response.json({ ok: true }),
      );
      const response = await protectedHandler(
        new Request(request, {
          method: "POST",
          headers: { authorization: "Bearer token" },
        }),
        {
          method: "tools/call",
          params: { name: "publish" },
        },
      );
      const text = await response.text();

      expect(response.status).toBe(503);
      expect(text).toContain("Authentication service unavailable");
      expect(text).not.toContain("backend secret");
      expect(text).not.toContain("timed out");
    },
  );
});
