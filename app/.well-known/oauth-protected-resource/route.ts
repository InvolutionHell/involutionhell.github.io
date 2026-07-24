import { getPublicOrigin } from "mcp-handler";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export function GET(request: Request): Response {
  return Response.json(
    {
      resource: `${getPublicOrigin(request)}/api/mcp`,
      bearer_methods_supported: ["header"],
      scopes_supported: ["publish"],
    },
    { headers: corsHeaders },
  );
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}
