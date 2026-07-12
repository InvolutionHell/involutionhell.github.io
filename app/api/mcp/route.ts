import { createMcpHandler } from "mcp-handler";
import { protectMcpHandler } from "@/lib/mcp/auth";
import { createMcpPostHandler } from "@/lib/mcp/request";
import { registerMcpTools } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const mcpHandler = protectMcpHandler(
  createMcpHandler(
    registerMcpTools,
    {
      serverInfo: { name: "involutionhell", version: "0.1.0" },
      instructions:
        "Use this server to search the InvolutionHell documentation community and publish lightweight Markdown posts. Search is public and supports Chinese or English article indexes. Publish writes to the authenticated user's InvolutionHell account and requires an Authorization Bearer satoken.",
    },
    {
      basePath: "/api",
      disableSse: true,
      sessionIdGenerator: undefined,
      maxDuration,
    },
  ),
);

export const GET = (request: Request): Promise<Response> => mcpHandler(request);
export const POST = createMcpPostHandler(mcpHandler);
