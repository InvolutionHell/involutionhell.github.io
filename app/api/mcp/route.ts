import { createMcpHandler } from "mcp-handler";
import { protectMcpHandler } from "@/lib/mcp/auth";
import {
  createMcpPostHandler,
  MCP_CORS_HEADERS,
  withMcpCors,
} from "@/lib/mcp/request";
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

export const GET = withMcpCors(mcpHandler);
export const POST = withMcpCors(createMcpPostHandler(mcpHandler));

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...MCP_CORS_HEADERS,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, content-type, accept, mcp-protocol-version",
      "Access-Control-Max-Age": "86400",
    },
  });
}
