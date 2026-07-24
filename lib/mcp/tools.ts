import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getVerifiedIdentity } from "@/lib/mcp/auth";
import { PublishError, publishPost } from "@/lib/mcp/publish";
import { limitMcpSearch } from "@/lib/mcp/rate-limit";
import {
  publishInputSchema,
  publishOutputSchema,
  searchInputSchema,
  searchOutputSchema,
} from "@/lib/mcp/schemas";

export function registerMcpTools(server: McpServer): void {
  server.registerTool(
    "search",
    {
      title: "Search InvolutionHell articles",
      description:
        "Search the InvolutionHell documentation corpus. Use locale zh for Chinese articles and en for English translations.",
      inputSchema: searchInputSchema,
      outputSchema: searchOutputSchema,
      annotations: { readOnlyHint: true },
    },
    async (input, extra) => {
      const rateLimit = await limitMcpSearch(extra.requestInfo);
      if (!rateLimit.success) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Search rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
            },
          ],
        };
      }

      const { searchSiteArticles } = await import("@/lib/mcp/search");
      const results = await searchSiteArticles(input);
      return {
        content: [
          {
            type: "text",
            text:
              results.length === 0
                ? "No matching InvolutionHell articles were found."
                : JSON.stringify(results, null, 2),
          },
        ],
        structuredContent: { results },
      };
    },
  );

  server.registerTool(
    "publish",
    {
      title: "Publish an InvolutionHell post",
      description:
        "Publish a lightweight Markdown post to the authenticated InvolutionHell account. Requires Authorization: Bearer <satoken> on the MCP request.",
      inputSchema: publishInputSchema,
      outputSchema: publishOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (input, extra) => {
      const identity = getVerifiedIdentity(extra.authInfo);
      if (!identity) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Authentication required. Sign in to InvolutionHell, obtain a satoken, and reconnect with Authorization: Bearer <satoken>.",
            },
          ],
        };
      }

      try {
        const published = await publishPost(input, identity.backendHeaders);
        return {
          content: [
            {
              type: "text",
              text: `Published “${published.title}”: ${published.url}`,
            },
          ],
          structuredContent: published,
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                error instanceof PublishError
                  ? error.message
                  : "Publishing failed unexpectedly. Try again later.",
            },
          ],
        };
      }
    },
  );
}
