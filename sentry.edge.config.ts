/**
 * Sentry Edge runtime 初始化（middleware 及未来可能出现的 Edge routes）。
 * 当前仓库根目录的 proxy.ts（Next.js 16 改名）即在此 runtime 执行。
 *
 * 启用条件：production 构建 + DSN 已配置，避免 DSN 漏配时 SDK 启动时打
 * 告警。读 SENTRY_DSN 私有 env（issue #302 P2-2），fallback 到旧的
 * NEXT_PUBLIC_SENTRY_DSN 兼容现有部署。
 *
 * beforeSend：过滤敏感请求头（issue #302 P1-2），避免凭据上报。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  // 10% 采样：与 server config 对齐，保证 client/server/edge 三处 trace 比例一致，
  // 跨 runtime 串联请求链路才完整。省 CPU 的 hack 撤回，observability 优先。
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    if (event.request?.headers) {
      const h = event.request.headers as Record<string, string>;
      delete h.satoken;
      delete h.Satoken;
      delete h.cookie;
      delete h.Cookie;
      delete h.authorization;
      delete h.Authorization;
    }
    return event;
  },
});
