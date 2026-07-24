import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";

const searchState = vi.hoisted(() => ({
  moduleLoads: 0,
  search: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/mcp/rate-limit", () => ({
  limitMcpSearch: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("@/lib/mcp/search", () => {
  searchState.moduleLoads += 1;
  return { searchSiteArticles: searchState.search };
});

import { registerMcpTools } from "@/lib/mcp/tools";

describe("MCP tool loading", () => {
  it("loads the search implementation only when search is called", async () => {
    const callbacks = new Map<
      string,
      (input: never, extra: never) => Promise<unknown>
    >();
    const server = {
      registerTool: vi.fn(
        (
          name: string,
          _definition: unknown,
          callback: (input: never, extra: never) => Promise<unknown>,
        ) => callbacks.set(name, callback),
      ),
    };

    registerMcpTools(server as unknown as McpServer);
    expect(searchState.moduleLoads).toBe(0);

    await callbacks.get("search")!(
      { query: "array", locale: "en", limit: 8 } as never,
      { requestInfo: {} } as never,
    );

    expect(searchState.moduleLoads).toBe(1);
    expect(searchState.search).toHaveBeenCalledWith({
      query: "array",
      locale: "en",
      limit: 8,
    });
  });
});
