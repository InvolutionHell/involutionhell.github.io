const MAX_BODY_BYTES = 1024 * 1024;

export const MCP_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "WWW-Authenticate",
};

type ParsedMcpHandler = (
  request: Request,
  body: unknown,
) => Response | Promise<Response>;

class BodyTooLargeError extends Error {}

type McpRouteHandler = (request: Request) => Response | Promise<Response>;

export function withMcpCors(
  handler: McpRouteHandler,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const response = await handler(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(MCP_CORS_HEADERS)) {
      headers.set(name, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

function jsonRpcError(status: number, code: number, message: string): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    },
    { status },
  );
}

async function readBodyText(request: Request): Promise<string> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new BodyTooLargeError();
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

export function createMcpPostHandler(
  handler: ParsedMcpHandler,
): (request: Request) => Promise<Response> {
  return async (request) => {
    let text: string;
    try {
      text = await readBodyText(request);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        return jsonRpcError(413, -32600, "Request body exceeds the 1 MB limit");
      }
      throw error;
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return jsonRpcError(400, -32700, "Parse error");
    }

    if (Array.isArray(body)) {
      return jsonRpcError(400, -32600, "JSON-RPC batches are not supported");
    }

    const validatedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: text,
      signal: request.signal,
    });
    return handler(validatedRequest, body);
  };
}
