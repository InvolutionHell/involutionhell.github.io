// next.config.mjs
import { createMDX } from "fumadocs-mdx/next";
import createNextIntlPlugin from "next-intl/plugin";

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
const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
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
      {
        protocol: "https",
        hostname: "mirrors.creativecommons.org",
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

export default withNextIntl(withMDX(config));
