import { describe, expect, it, vi } from "vitest";
import { createMcpPostHandler } from "@/lib/mcp/request";

function post(body: string, headers?: HeadersInit): Request {
  return new Request("https://involutionhell.com/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("MCP request boundary", () => {
  it("returns a JSON-RPC parse error without invoking the handler", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const response = await createMcpPostHandler(handler)(post("{oops"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32700 },
      id: null,
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects JSON-RPC batches", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const response = await createMcpPostHandler(handler)(post("[]"));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: -32600 },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects request bodies larger than 1 MB", async () => {
    const handler = vi.fn(() => Response.json({ ok: true }));
    const response = await createMcpPostHandler(handler)(
      post(JSON.stringify({ value: "x".repeat(1024 * 1024) })),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: { code: -32600 },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes parsed JSON and a reconstructed readable request", async () => {
    const body = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}';
    const handler = vi.fn(async (request: Request, parsed: unknown) =>
      Response.json({ text: await request.text(), parsed }),
    );
    const response = await createMcpPostHandler(handler)(post(body));

    expect(await response.json()).toEqual({
      text: body,
      parsed: { jsonrpc: "2.0", id: 1, method: "tools/list" },
    });
  });
});
