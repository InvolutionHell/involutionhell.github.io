import { describe, expect, it, vi } from "vitest";
import { createRetryablePromiseCache } from "@/lib/mcp/promise-cache";

describe("MCP shard promise cache", () => {
  it("shares in-flight work and retries after a rejected build", async () => {
    const builder = vi
      .fn<(locale: "zh" | "en") => Promise<string>>()
      .mockRejectedValueOnce(new Error("build failed"))
      .mockResolvedValue("ready");
    const getCached = createRetryablePromiseCache(builder);

    const first = getCached("zh");
    expect(getCached("zh")).toBe(first);
    await expect(first).rejects.toThrow("build failed");
    await expect(getCached("zh")).resolves.toBe("ready");
    expect(builder).toHaveBeenCalledTimes(2);
  });
});
