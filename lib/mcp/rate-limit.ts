import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RequestInfo } from "@modelcontextprotocol/sdk/types.js";

let cachedLimiter: Ratelimit | null | undefined;
let warnedMissingUpstash = false;

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) return value;
  }
  return undefined;
}

function getLimiter(): Ratelimit | null {
  if (cachedLimiter !== undefined) return cachedLimiter;
  const url = firstEnv(
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_KV_REST_API_URL",
    "KV_REST_API_URL",
  );
  const token = firstEnv(
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
    "KV_REST_API_TOKEN",
  );
  if (!url || !token) {
    cachedLimiter = null;
    return cachedLimiter;
  }

  cachedLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "ratelimit:mcp:search",
  });
  return cachedLimiter;
}

function headerValue(
  headers: RequestInfo["headers"] | undefined,
  name: string,
): string | undefined {
  const entry = Object.entries(headers ?? {}).find(
    ([key]) => key.toLowerCase() === name,
  )?.[1];
  return Array.isArray(entry) ? entry[0] : entry;
}

function clientIp(headers: RequestInfo["headers"] | undefined): string {
  const realIp = headerValue(headers, "x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headerValue(headers, "x-forwarded-for");
  const parts = forwarded
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts?.at(-1) ?? "anonymous";
}

export async function limitMcpSearch(
  requestInfo: RequestInfo | undefined,
): Promise<{ success: boolean; retryAfterSeconds?: number }> {
  const limiter = getLimiter();
  if (!limiter) {
    if (!warnedMissingUpstash) {
      warnedMissingUpstash = true;
      console.warn(
        "[mcp] Upstash is not configured; search rate limiting is disabled",
      );
    }
    return { success: true };
  }

  const result = await limiter.limit(clientIp(requestInfo?.headers));
  if (result.success) return { success: true };
  return {
    success: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    ),
  };
}
