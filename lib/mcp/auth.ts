import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { getPublicOrigin } from "mcp-handler";

const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";

interface BackendUser {
  id: number;
  username: string;
}

interface VerifiedIdentity {
  user: BackendUser;
  backendHeaders: Record<string, string>;
}

function backendUrl(): string {
  return process.env.BACKEND_URL ?? "http://localhost:8080";
}

export async function verifyToken(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const response = await fetch(`${backendUrl()}/auth/me`, {
    headers: { satoken: bearerToken },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401 || response.status === 403) return undefined;
  if (!response.ok) {
    throw new Error(`Authentication backend returned HTTP ${response.status}`);
  }

  const body = (await response.json()) as { data?: Partial<BackendUser> };
  if (typeof body.data?.id !== "number" || !body.data.username) {
    throw new Error("Authentication backend returned an invalid user payload");
  }

  return {
    token: bearerToken,
    clientId: `involutionhell-user:${body.data.id}`,
    scopes: ["publish"],
    extra: {
      user: {
        id: body.data.id,
        username: body.data.username,
      },
    },
  };
}

export function getVerifiedIdentity(
  authInfo: AuthInfo | undefined,
): VerifiedIdentity | undefined {
  const user = authInfo?.extra?.user as BackendUser | undefined;
  if (!authInfo || typeof user?.id !== "number" || !user.username) {
    return undefined;
  }
  return {
    user,
    backendHeaders: { satoken: authInfo.token },
  };
}

export function isPublishCall(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const request = body as {
    method?: unknown;
    params?: { name?: unknown };
  };
  return request.method === "tools/call" && request.params?.name === "publish";
}

function hasBearerToken(request: Request): boolean {
  const authorization = request.headers.get("authorization")?.trim();
  return /^Bearer\s+\S+$/i.test(authorization ?? "");
}

function invalidTokenResponse(request: Request): Response {
  const metadataUrl = `${getPublicOrigin(request)}${RESOURCE_METADATA_PATH}`;
  const description =
    "Authorization: Bearer <satoken> is required to call publish";
  return Response.json(
    { error: "invalid_token", error_description: description },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}", resource_metadata="${metadataUrl}"`,
      },
    },
  );
}

function authUnavailableResponse(): Response {
  return Response.json(
    {
      error: "temporarily_unavailable",
      error_description: "Authentication service unavailable. Try again later.",
    },
    { status: 503 },
  );
}

export function protectMcpHandler(
  handler: (request: Request) => Response | Promise<Response>,
): (request: Request, body?: unknown) => Promise<Response> {
  return async (request, body) => {
    if (request.method !== "POST" || !isPublishCall(body)) {
      return handler(request);
    }
    if (!hasBearerToken(request)) {
      return invalidTokenResponse(request);
    }

    const authorization = request.headers.get("authorization")!.trim();
    const bearerToken = authorization.replace(/^Bearer\s+/i, "");
    let authInfo: AuthInfo | undefined;
    try {
      authInfo = await verifyToken(request, bearerToken);
    } catch {
      return authUnavailableResponse();
    }
    if (!authInfo) return invalidTokenResponse(request);

    request.auth = authInfo;
    return handler(request);
  };
}
