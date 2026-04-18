// next.config.mjs
import { createMDX } from "fumadocs-mdx/next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * IMPORTANT: remarkImage 配置已移至 source.config.ts 统一管理
 *
 * 原因：
 * 1. 避免配置冲突 - 之前这里的 remarkPlugins 会覆盖 source.config.ts 的配置
 * 2. 统一管理 - 所有 MDX 相关配置（remarkPlugins, rehypePlugins, remarkImageOptions）
 *    都在 source.config.ts 中，便于维护
 *
 * 如需修改图片处理配置，请前往 source.config.ts
 */
const withMDX = createMDX({
  configPath: "source.config.ts",
  // mdxOptions 留空，让 source.config.ts 统一管理所有 remark/rehype 插件
});
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /**
   * 文档目录重组产生的老 URL → 新 canonical URL 的 301 重定向。
   *
   * 为什么需要：站点上线一段时间后，原路径被 Google 索引 + 被用户收藏 / 外链引用。
   * 目录重组（比如把 CommunityShare/RAG/* 搬到 ai/foundation-models/rag/*）
   * 必然改 URL；不加 301 的话老链接一律 404，SEO 权重流失 + 用户体验断裂。
   *
   * 用 statusCode: 301 显式下发真正的 301（"Moved Permanently"）。
   * Next.js 默认 permanent:true 下发的是 308 —— SEO 语义等价，但 HTTP
   * 协议语义上 308 严格保留 method、301 对 POST 含糊。文档 URL 都是 GET，
   * 两者对爬虫基本等价，选 301 是因为：
   *   - 历史最老最广为人知的"永久跳转"语义，老爬虫 / 老工具识别最稳
   *   - Google Search Console 报告里显式认 301
   *   - 和 commit 描述、PR 描述里写的 "301" 口径一致
   * statusCode 与 permanent 互斥，这里用 statusCode 覆盖默认的 308 行为。
   *
   * 每次再动 docs 路径，都要在这里补一条。
   */
  async redirects() {
    return [
      // feat/docs-reorg-rag-projects（2026-04-18）
      {
        source: "/docs/CommunityShare/RAG/rag",
        destination: "/docs/ai/foundation-models/rag/rag",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/RAG/embedding",
        destination: "/docs/ai/foundation-models/rag/embedding",
        statusCode: 301,
      },
      {
        // 文件名也规范化成 kebab-case：context_engineering_intro → context-engineering-intro
        source: "/docs/CommunityShare/RAG/context_engineering_intro",
        destination: "/docs/ai/foundation-models/rag/context-engineering-intro",
        statusCode: 301,
      },
      {
        source: "/docs/all-projects/ai-town",
        destination: "/docs/ai/projects/ai-town",
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      {
        // GitHub OAuth 回调：GitHub → localhost:3000/api/auth/callback/github → 后端
        // 路径与 GitHub OAuth App 注册的 callback URL 保持一致，无需改 GitHub App 设置
        source: "/api/auth/callback/github",
        destination: `${backendUrl}/api/auth/callback/github`,
      },
      {
        // 认证 API（/auth/me, /auth/logout 等）走 Next.js 代理，避免浏览器跨域 CORS 问题
        // 浏览器只见 localhost:3000，Next.js 服务端再转发给 localhost:8080
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/analytics/:path*",
        destination: `${backendUrl}/analytics/:path*`,
      },
      {
        // 用户中心 API（偏好设置等）代理到后端，避免浏览器跨域
        source: "/api/user-center/:path*",
        destination: `${backendUrl}/api/user-center/:path*`,
      },
      {
        // OAuth 跳转入口（/oauth/render/github），走 rewrite 让前端不感知后端端口
        // 后端返回 302 到 GitHub 授权页，Next.js 透传 302 给浏览器完成跳转
        source: "/oauth/:path*",
        destination: `${backendUrl}/oauth/:path*`,
      },
      {
        // 文档 commit 历史代理到 Java（带 Caffeine 10min 缓存 + GITHUB_TOKEN），
        // 原 Next API Route 已删除，避免 Vercel Fluid CPU 被拉取 GitHub API 的请求吃掉
        source: "/api/docs/history",
        destination: `${backendUrl}/api/docs/history`,
      },
      {
        // Events 公开读接口 + 感兴趣接口
        // 需要两条规则：`/:path*` 不匹配空路径（即 /api/events 本身）
        source: "/api/events",
        destination: `${backendUrl}/api/events`,
      },
      {
        source: "/api/events/:path*",
        destination: `${backendUrl}/api/events/:path*`,
      },
      {
        // Events 管理员 CRUD（后端 @SaCheckRole("admin") 做权限校验）
        source: "/api/admin/events",
        destination: `${backendUrl}/api/admin/events`,
      },
      {
        source: "/api/admin/events/:path*",
        destination: `${backendUrl}/api/admin/events/:path*`,
      },
      {
        // 超管用户管理（后端 @SaCheckRole("superadmin") 做权限校验）
        source: "/api/admin/users",
        destination: `${backendUrl}/api/admin/users`,
      },
      {
        source: "/api/admin/users/:path*",
        destination: `${backendUrl}/api/admin/users/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.github.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.nlark.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.coly.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
    /**
     * CRITICAL: 禁用 Next.js 图片优化
     *
     * 原因：Vercel 的图片优化配额已耗尽
     *
     * 重要说明：
     * - Vercel 免费计划的图片优化有配额限制（每月 1000 次源图片优化）
     * - 我们的网站图片较多，很快会超出配额
     * - 超出配额后会导致图片加载失败或构建失败
     * - 因此必须设置 unoptimized: true 禁用图片优化
     *
     * 影响：
     * - ✅ 图片会以原始格式和尺寸提供（不会被 Vercel 优化）
     * - ✅ 不消耗 Vercel 配额
     * - ⚠️  失去自动格式转换（WebP/AVIF）和尺寸优化
     * - ⚠️  可能有轻微的性能影响（但我们已使用 Cloudflare R2 等 CDN）
     *
     * 如果未来升级到付费计划或迁移到自托管，可以考虑移除此选项
     */
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

const finalConfig = withNextIntl(withMDX(config));

// Sentry 包裹：webpack 插件需要看到最终的 Next 配置才能上传 source map。
// silent: !CI 让本地构建不刷日志，只在 Vercel CI 构建时打印。
// widenClientFileUpload 扩大 source map 扫描范围，保证前端错误堆栈能解出来。
// disableLogger 树摇掉 Sentry 自带 logger，减小 bundle 体积。
//
// 守门条件：三件套 AUTH_TOKEN + ORG + PROJECT 必须同时齐全才启用（Copilot CR）。
// 以前只看 AUTH_TOKEN 并给 org/project 硬编码 fallback，导致谁本地只设 token
// 不设 org/project 时会把 source map 错传到默认项目污染错误归因。现在要么配齐，
// 要么完全跳过 webpack 插件 —— 贡献者 clone 仓库后零配置也能 `pnpm build`。
const enableSentry = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT,
);

export default enableSentry
  ? withSentryConfig(finalConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      // 不启用 tunnelRoute：需要加 /monitoring rewrite，和现有 rewrites 交互
      // 复杂；广告屏蔽对 docs 站影响小，后续真需要再打开。
    })
  : finalConfig;
