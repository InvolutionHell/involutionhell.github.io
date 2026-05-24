// next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

// Next.js 16 detects multi-lockfile environments by searching upward for
// pnpm-lock.yaml / package-lock.json / yarn.lock. 当父目录意外有 lockfile
// 时（如开发服务器上 /home/ubuntu/package-lock.json），Next 会把 workspace
// root 推到上层，turbopack 跟着到错的目录解析 node_modules，
// 触发 "Can't resolve 'tailwindcss'" 之类报错。
// 显式锁定到 frontend 自己目录，turbopack + outputFileTracing 双保险。
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
  // 强制锁定 turbopack 和 SSR file tracing 的根目录到 frontend/ 自己，
  // 避免上层意外 lockfile 把 root 推错（详见文件顶部注释）。
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  /**
   * docs 目录整理产生的 URL 变化 → 301 重定向。
   *
   * 为什么要 301：站点上线一段时间后，原路径被 Google 索引 + 被用户收藏 / 外链。
   * 改目录 / 文件名必然改 URL，不加 301 的话老链接 404，SEO 权重流失 +
   * 用户体验断裂。statusCode:301 显式下发 "Moved Permanently"（不是 Next.js
   * 默认 permanent:true 的 308）。两者 SEO 语义等价，选 301 因为识别最稳、
   * 和 PR / commit 描述口径一致。statusCode 与 permanent 互斥；Next.js 源码
   * redirect-status.js 里 allowedStatusCodes = {301,302,303,307,308}，合法。
   *
   * 每次再动 docs 路径都要在这里补一条。
   */
  async redirects() {
    // Option C IA 大重组：按读者意图分 learn / career / community / projects 四大顶层区。
    // 顺序敏感——Next.js 首匹配命中，特殊文件级 + cpp_backend 老名字必须排在 wildcard 前。
    //
    // 2026-05 i18n URL 段化（PR #330）：所有 destination 都带 /zh/ 前缀
    // （默认 locale）。不带前缀的话会先 301 到 /docs/...，next-intl
    // middleware 再 308 到 /zh/docs/...，对 SEO 是两跳 redirect。直接
    // destination 写带前缀的 canonical URL 让搜索引擎和用户都单跳到位。
    // 英语用户由站内 <LocaleToggle /> 切到 /en/docs/...，cookie 同步偏好。
    // source 保持不带 locale 形式（匹配老 URL）。
    return [
      // ============= i18n 段化前的 .en/.zh locale 文件后缀 → 段化 canonical =============
      // 段化（2026-05）前 locale 是文件后缀（/docs/foo.en），段化后变成 URL 段前缀
      // （/en/docs/foo）。GSC 里仍存着上百条 .en/.zh 旧 URL（最大一类 404）。
      //
      // 为什么放在这里而不是 proxy.ts：proxy 的 matcher 排除了 `.*\..*`，任何带点
      // 路径（.en/.zh 后缀全带点）根本不进中间件。next.config redirects 跑在路由层，
      // 不受该排除影响，是带点旧 URL 唯一能 301 兜住的地方。
      //
      // 必须排在 IA wildcard 之前：先剥 locale 后缀 / index，命中即单跳到位。
      // :slug(.*) 贪婪吃掉含 `/` 的多级路径，结尾的 \.en / \.zh 做字面锚定。
      {
        source: "/docs/:slug(.*)/index.en",
        destination: "/en/docs/:slug",
        statusCode: 301,
      },
      {
        source: "/docs/:slug(.*)/index.zh",
        destination: "/zh/docs/:slug",
        statusCode: 301,
      },
      { source: "/docs/index.en", destination: "/en/docs", statusCode: 301 },
      { source: "/docs/index.zh", destination: "/zh/docs", statusCode: 301 },
      {
        source: "/docs/:slug(.*)\\.en",
        destination: "/en/docs/:slug",
        statusCode: 301,
      },
      {
        source: "/docs/:slug(.*)\\.zh",
        destination: "/zh/docs/:slug",
        statusCode: 301,
      },

      // ============= 特殊路径（必须在 wildcard 之前） =============
      // CommunityShare/RAG → learn/ai/foundation-models/rag （RAG 文件归 ai 主题）
      {
        source: "/docs/CommunityShare/RAG/rag",
        destination: "/zh/docs/learn/ai/foundation-models/rag/rag",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/RAG/embedding",
        destination: "/zh/docs/learn/ai/foundation-models/rag/embedding",
        statusCode: 301,
      },
      {
        // 文件名顺手规范化：context_engineering_intro → context-engineering-intro
        source: "/docs/CommunityShare/RAG/context_engineering_intro",
        destination:
          "/zh/docs/learn/ai/foundation-models/rag/context-engineering-intro",
        statusCode: 301,
      },
      // CommunityShare/Geek/leworldmodel → community/papers（paper summary 归社区论文）
      {
        source: "/docs/CommunityShare/Geek/leworldmodel",
        destination: "/zh/docs/community/papers/leworldmodel",
        statusCode: 301,
      },
      // CommunityShare/Amazing-AI-Tools 下两篇分家：tool review 归 tools，paper 归 papers
      {
        source: "/docs/CommunityShare/Amazing-AI-Tools/perplexity-comet",
        destination: "/zh/docs/community/tools/perplexity-comet",
        statusCode: 301,
      },
      {
        source:
          "/zh/docs/CommunityShare/Amazing-AI-Tools/prompt-repetition-improves-non-reasoning-llms",
        destination:
          "/zh/docs/community/papers/prompt-repetition-improves-non-reasoning-llms",
        statusCode: 301,
      },
      // PPO 强化学习主题 → learn/ai/reinforcement-learning
      {
        source:
          "/zh/docs/CommunityShare/Personal-Study-Notes/Reinforcement-Learning/ppo",
        destination: "/zh/docs/learn/ai/reinforcement-learning/ppo",
        statusCode: 301,
      },
      // swanlab 之前 test run 已移到 ai/misc-tools/（main commit d6d0a3d），现改到 community/tools
      {
        source: "/docs/ai/misc-tools/swanlab",
        destination: "/zh/docs/community/tools/swanlab",
        statusCode: 301,
      },
      // cpp_backend 老命名（下划线 / 大驼峰）→ learn/cs/cpp-backend/ (kebab-case)
      {
        source: "/docs/computer-science/cpp_backend/mempool_simple",
        destination: "/zh/docs/learn/cs/cpp-backend/mempool-simple",
        statusCode: 301,
      },
      {
        source:
          "/zh/docs/computer-science/cpp_backend/Handwritten_pool_components/1_Handwritten_threadpool",
        destination:
          "/zh/docs/learn/cs/cpp-backend/handwritten-pool-components/1-handwritten-threadpool",
        statusCode: 301,
      },
      {
        source:
          "/zh/docs/computer-science/cpp_backend/Handwritten_pool_components/2_Handwritten_mempool1",
        destination:
          "/zh/docs/learn/cs/cpp-backend/handwritten-pool-components/2-handwritten-mempool1",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/cpp_backend/easy_compile/1_cpp_libs",
        destination: "/zh/docs/learn/cs/cpp-backend/easy-compile/1-cpp-libs",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/cpp_backend/easy_compile/2_base_gcc",
        destination: "/zh/docs/learn/cs/cpp-backend/easy-compile/2-base-gcc",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/cpp_backend/easy_compile/3_Make",
        destination: "/zh/docs/learn/cs/cpp-backend/easy-compile/3-make",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/cpp_backend/easy_compile/4_CMake",
        destination: "/zh/docs/learn/cs/cpp-backend/easy-compile/4-cmake",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/cpp_backend/easy_compile/5_vcpkg",
        destination: "/zh/docs/learn/cs/cpp-backend/easy-compile/5-vcpkg",
        statusCode: 301,
      },
      // all-projects/ai-town → projects/ai-town （顶层化）
      {
        source: "/docs/all-projects/ai-town",
        destination: "/zh/docs/projects/ai-town",
        statusCode: 301,
      },
      // all-projects 裸路径本身也要兜底，防止指 /docs/all-projects 直接 404
      {
        source: "/docs/all-projects",
        destination: "/zh/docs/projects",
        statusCode: 301,
      },
      // CommunityShare / Amazing-AI-Tools index 顶层
      {
        source: "/docs/CommunityShare",
        destination: "/zh/docs/community",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/Amazing-AI-Tools",
        destination: "/zh/docs/community/tools",
        statusCode: 301,
      },

      // ============= Wildcard 顶层区重命名 =============
      // 学科主目录：ai → learn/ai, computer-science → learn/cs
      {
        source: "/docs/ai/:path*",
        destination: "/zh/docs/learn/ai/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/computer-science/:path*",
        destination: "/zh/docs/learn/cs/:path*",
        statusCode: 301,
      },
      // 求职场景 jobs/{interview-prep,event-keynote} → career/{interview-prep,events}
      {
        source: "/docs/jobs/interview-prep/:path*",
        destination: "/zh/docs/career/interview-prep/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/jobs/event-keynote/:path*",
        destination: "/zh/docs/career/events/:path*",
        statusCode: 301,
      },
      // 项目 all-projects → projects
      {
        source: "/docs/all-projects/:path*",
        destination: "/zh/docs/projects/:path*",
        statusCode: 301,
      },
      // CommunityShare 分家：其他按主题归 community/*
      // ↑ Leetcode 的 301 从这里挪到 proxy.ts，因为 lib/source.ts 会把中文文件名拼音化，
      //   前缀替换 wildcard 跳过去的 URL slug 还是中文，目标页仍 404。proxy.ts 改用构建时
      //   生成的 slug 映射做字面匹配，单跳 301 到正确拼音 URL。
      {
        source: "/docs/CommunityShare/Language/:path*",
        destination: "/zh/docs/community/language/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/Life/:path*",
        destination: "/zh/docs/community/life/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/MentalHealth/:path*",
        destination: "/zh/docs/community/mental-health/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/Geek/:path*",
        destination: "/zh/docs/community/dev-tips/:path*",
        statusCode: 301,
      },
      {
        source: "/docs/CommunityShare/Amazing-AI-Tools/:path*",
        destination: "/zh/docs/community/tools/:path*",
        statusCode: 301,
      },

      // 段化前没有 /docs 前缀的更老 URL（GSC 里还有 /computer-science/...）
      {
        source: "/computer-science/:path*",
        destination: "/zh/docs/learn/cs/:path*",
        statusCode: 301,
      },

      // 注意：不要在这里加 `/docs/:path*` → `/zh/docs/:path*` 的 no-locale 兜底。
      // 那是个 301（永久），会抢在 next-intl middleware 之前把所有无前缀 /docs
      // 链接（Hero / Footer 站内链接 + 外链）强制钉到 zh，英文用户再也协商不到
      // /en（且被浏览器/Google 缓存）。无前缀路径交给 next-intl 按 Accept-Language
      // / NEXT_LOCALE 协商（307，单跳到 /zh 或 /en）才是对的。
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
      {
        // 社区分享链接公开读 + 提交 + 举报（/api/community/links 及子路径）
        // 与 Events 模块风格一致：根路径 + 子路径各一条
        source: "/api/community/links",
        destination: `${backendUrl}/api/community/links`,
      },
      {
        source: "/api/community/links/:path*",
        destination: `${backendUrl}/api/community/links/:path*`,
      },
      {
        // 社区分享 admin 路由：列表、通过、拒绝（走 @SaCheckRole("admin")）
        source: "/api/admin/community",
        destination: `${backendUrl}/api/admin/community`,
      },
      {
        source: "/api/admin/community/:path*",
        destination: `${backendUrl}/api/admin/community/:path*`,
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
