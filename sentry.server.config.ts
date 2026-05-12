/**
 * Sentry Node.js runtime 初始化（Next.js API routes / Server Components / RSC）。
 *
 * 与 client 同策略：production 且 DSN 已配置时启用，traces 10%，
 * 无 replay/profiling。加 DSN 校验是为了避免漏配 env 时 SDK 初始化打告
 * 警日志（Copilot CR）。
 *
 * Server / Edge 端读 SENTRY_DSN（私有 env）而非 NEXT_PUBLIC_SENTRY_DSN
 * （issue #302 P2-2）。NEXT_PUBLIC_ 前缀的 env 会打进客户端 bundle，
 * client config 必须用 public 那份；server / edge 没必要再暴露一份，
 * 走私有 env 更干净。两个 env 都没配时回退读 NEXT_PUBLIC_ 兜底，避免
 * 旧部署在迁移过程中突然丢 Sentry 上报。
 *
 * beforeSend：过滤敏感请求头（issue #302 P1-2），与 client config 同款。
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  // 10% → 2%（dev_docs/vercel-cpu-overage-2026-05.md H3）。
  // 10% 在月百万级请求量下产生 10w+ traces，每条 trace 上报又叠加 Fluid CPU。
  // 2% 仍能日采几千条覆盖 P95 性能趋势，trace 配额也更宽裕。
  tracesSampleRate: 0.02,
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
