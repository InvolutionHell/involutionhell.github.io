import { afterEach, describe, expect, it, vi } from "vitest";
import { PublishError, publishPost } from "@/lib/mcp/publish";

const input = {
  title: "A lightweight post",
  content_md: "# Hello\n\nBody",
  description: "Short description",
  tags: ["career", "community"],
  slug: "lightweight-post",
};

afterEach(() => {
  delete process.env.BACKEND_URL;
});

describe("MCP publish", () => {
  it("forwards the satoken and backend post body", async () => {
    process.env.BACKEND_URL = "https://backend.example";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          success: true,
          data: {
            title: "A lightweight post",
            slug: "lightweight-post",
            authorUsername: "alice",
          },
        },
        { status: 201 },
      ),
    );

    const result = await publishPost(
      input,
      { satoken: "secret-token" },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/api/posts",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          satoken: "secret-token",
        },
        body: JSON.stringify({
          title: "A lightweight post",
          contentMd: "# Hello\n\nBody",
          description: "Short description",
          tags: ["career", "community"],
          slug: "lightweight-post",
        }),
        signal: expect.any(AbortSignal),
      },
    );
    expect(result).toEqual({
      title: "A lightweight post",
      slug: "lightweight-post",
      url: "https://involutionhell.com/u/alice/posts/lightweight-post",
    });
  });

  it.each([
    [401, "token is expired or invalid"],
    [409, "slug already exists"],
    [500, "HTTP 500"],
  ])("translates backend HTTP %i", async (status, message) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status }));

    await expect(
      publishPost(input, { satoken: "secret-token" }, fetchMock),
    ).rejects.toEqual(
      expect.objectContaining<Partial<PublishError>>({
        message: expect.stringContaining(message),
      }),
    );
  });

  it("turns a timed-out backend request into a retryable publish error", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("timed out", "TimeoutError"));

    await expect(
      publishPost(input, { satoken: "secret-token" }, fetchMock),
    ).rejects.toEqual(
      expect.objectContaining<Partial<PublishError>>({
        message: expect.stringContaining("Try again later"),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
