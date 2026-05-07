/**
 * Sentry 浏览器端初始化。
 *
 * 免费 tier 策略（Developer plan，5K errors/月 + 10K perf units/月）：
 * - production 构建 + DSN 已配置才启用，避免本地 dev 污染配额 / DSN 漏配告警
 * - tracesSampleRate 0.1：10% 的页面 transaction 采样足够看性能趋势
 * - 关闭 Session Replay：它是另外的独立配额（小），开了容易炸
 * - 不启用 profiling（需要付费）
 *
 * beforeSend：过滤敏感请求头，避免 satoken / cookie / authorization 等
 * 凭据被原样上报到 Sentry（合规 + 减少误用攻击面，issue #302 P1-2）。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // 线上开 false 省日志；排障时临时改 true
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
