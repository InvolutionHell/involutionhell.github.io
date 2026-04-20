# 前后端分离架构约定

> 起草于 2026-04-15，PR #281 / `feat/user-profile-page` 迭代期间固化。

## 动机

involutionhell.com 早期为了快，前端 Next.js 做了不少后端该做的事：直连 Prisma 写埋点、在 Next API Route 里拼 GitHub API、在 Server Component 里做聚合查询等。结果：

- Vercel Fluid Active CPU 一度冲到 **3h24m/4h (85%)**，再往上就要付费
- 后端 Java 有连接池、Caffeine、常驻进程，反而闲着
- 逻辑散落两端，同一张表两边读写难维护

2026-04 迭代把边界划清，这篇是约定。

---

## 边界划分

```
┌─────────────────────────────────────────────────────────────────┐
│ 浏览器                                                           │
└────┬──────────────────────────────────────────────────┬──────────┘
     │ 纯静态 / SSR HTML                                  │ 动态数据 API
     ▼                                                   ▼
┌──────────────────────────────┐             ┌─────────────────────┐
│ Next.js (Vercel)             │   rewrites  │ Java Spring Boot    │
│                              │ ──────────► │ (Oracle / Railway)  │
│ - Static pages (SSG/ISR)     │             │                     │
│ - SSR for /, /rank, /u/[x]   │             │ - 业务逻辑            │
│ - fumadocs MDX 渲染           │             │ - 数据库读写（唯一入口）│
│ - middleware.ts (locale)     │             │ - Caffeine 缓存       │
│ - search.{zh,en}.json 索引    │             │ - SaToken 认证        │
│ - /api/* 只做：               │             │ - GitHub OAuth 回调    │
│   · /api/chat (LLM 代理)      │             │ - GA4 聚合            │
│   · /api/docs-tree (纯 MDX)   │             │                     │
│   · /api/docs/history (cron)  │             └──────────┬──────────┘
│   · /api/suggestions (纯本地) │                        │
│   · /api/upload (S3 中转)     │                        ▼
│   · /api/indexnow (SEO CICD)  │             ┌─────────────────────┐
└──────────────────────────────┘             │ PostgreSQL          │
                                              └─────────────────────┘
```

### 前端（Next.js）只做这些

1. **渲染**：静态页 + SSR + ISR
2. **路由层 SEO / metadata**
3. **i18n 切换**（middleware 读 cookie、layout 选 search 索引）
4. **fumadocs 文档管线**（MDX → HTML + search.json）
5. **纯前端缓存**（sessionStorage、fetch revalidate）
6. 必要的 BFF 路由：
   - `POST /api/chat` — LLM 代理（key 不能暴露，必须服务端）
   - `GET /api/docs/history` — 临时保留，V2 迁 Java
   - `GET /api/docs-tree` — 读 fumadocs source，纯本地
   - `GET /api/suggestions` — 静态候选词
   - `POST /api/upload` — S3 预签名
   - `POST /api/indexnow` — CI/CD 触发，一天一次

### 后端（Java）负责这些

1. **所有业务逻辑**（认证、用户中心、埋点写入、排行榜、GA4 聚合）
2. **唯一的数据库读写入口**（Prisma 生成的 schema 由前端维护，但运行时 DB 只被 Java 访问）
3. **可缓存的外部 API 代理**（GA4 → Caffeine 10min、将来 GitHub commits → Caffeine 1h）
4. **认证体系**（SaToken + JustAuth GitHub OAuth）

### 不能再做的事

- ❌ Next API Route 里直接 `import { prisma } from "@/lib/db"`
- ❌ 在 Server Component 里跑 `source.getPages()` 做聚合查询（换成 build-time 生成 JSON 或调后端）
- ❌ 为了"省一次网络请求"在前端复刻后端逻辑

---

## URL 约定

前端 `next.config.mjs` 的 `rewrites()` 统一把这些路径**透传到 Java**：

| 前端可见路径                | 转发到 Java | 用途                                 |
| --------------------------- | ----------- | ------------------------------------ |
| `/auth/*`                   | `/auth/*`   | SaToken 登录 / me / logout           |
| `/oauth/*`                  | `/oauth/*`  | GitHub OAuth 发起                    |
| `/api/auth/callback/github` | 同名        | GitHub OAuth 回调                    |
| `/analytics/*`              | 同名        | 埋点写入 + top-docs + events/summary |
| `/api/user-center/*`        | 同名        | 用户偏好 / profile                   |

这么做的好处：

- 浏览器只看到同源请求，**零 CORS 配置**
- Vercel 对 rewrite 是 **edge proxy 不是 function invocation**，**不吃 Fluid CPU**
- 环境切换只改 `BACKEND_URL` 一个变量

---

## 环境变量约定

**生产环境不做硬编码 fallback**（`?? "http://localhost:8081"` 这类写法在生产环境禁止）。
当前仓库里还有少量开发态 / 历史路径在用 `BACKEND_URL ?? "http://localhost:8080"`
（例如 `next.config.mjs` 的 rewrites 和 `app/api/upload/route.ts`），目的是本地联调
时减少启动门槛；这些只是过渡状态，**不能作为长期约定**。

原因：端口不一致（8080/8081/其他）时，fallback 很容易把"漏配"变成"静默请求到错误地址"，
排查成本更高。新代码应该在 env 缺失时显式报错或返回空结果。

| 变量                      | 前端读取场景                 | 设置位置                               |
| ------------------------- | ---------------------------- | -------------------------------------- |
| `BACKEND_URL`             | Server 端（SSR、API Route）  | `.env.local` (dev) / Vercel env (prod) |
| `NEXT_PUBLIC_BACKEND_URL` | **不要用**（见下方踩坑说明） | 仅本地 curl 测试时临时设置             |

**`NEXT_PUBLIC_BACKEND_URL` 不再用于客户端 fetch**。客户端一律 fetch 同源相对路径
（`/analytics/*` / `/auth/*` / `/api/*` 等），由 Next.js rewrite 代理到后端。

踩坑记录（2026-04-20）：之前 `HotDocsTab` 里保留了 `process.env.NEXT_PUBLIC_BACKEND_URL ?? ""`
作为"本地 Next.js 没起时的逃生门"。结果 Vercel env 被误配成 `https://api.involutionhell.com`，
客户端 fetch 变跨域 → 后端未发 CORS header → 浏览器 `ERR_FAILED` → `/rank?tab=hot`
整块"加载失败"。现已从根拔掉这个 fallback（commit `fix: hotdocs cors hardcode`）。

如果某天真要在浏览器跨域直连后端（比如跨站嵌入场景），请先给后端配 CORS 白名单再恢复变量。

`.env.sample` 里保留 `BACKEND_URL=http://localhost:8080` 作为模板，开发者 `cp .env.sample .env.local` 后按自己后端端口改。

`_DEV` 后缀只用于**需要两套不同值的场景**（例如 `AUTH_GITHUB_ID_DEV` = 本地 OAuth App，`AUTH_GITHUB_ID` = 生产 OAuth App）。

---

## 个人主页 feature 的落地（范例）

以 `/u/[username]` 为例说明约定怎么应用：

### 数据流

```
浏览器访问 /u/longsizhuo
    │
    ▼
Next.js SSR app/u/[username]/page.tsx
    │
    │ fetch(`${BACKEND_URL}/api/user-center/profile/longsizhuo`)
    │ next: { revalidate: 300 }    ← ISR 缓存 5min
    │
    ▼
Java GET /api/user-center/profile/{username}
    │ （SaToken 白名单，匿名可访问）
    │
    ├─ UserCenterService.findByUsername()  → UserAccount
    └─ UserCenterService.getPreferences()  → Map<String, Object>
    │
    ▼
返回 { user: UserView, preferences: {...} }
    │
    ▼
Next 渲染 HTML + Bento Grid + ProfileCard 组件
```

### 数据契约

`preferences` JSONB 约定这些顶层 key：

```jsonc
{
  "bio": "一句话简介",
  "tagline": "小标题（比如研究方向）",
  "links": [
    { "label": "GitHub", "url": "https://..." },
    { "label": "Blog", "url": "https://..." },
  ],
  "projects": [
    {
      "title": "项目名",
      "description": "一段描述",
      "url": "https://...",
      "tags": ["TypeScript", "LLM"],
    },
  ],
  "pinned_papers": [
    {
      "title": "论文标题",
      "authors": "Alice, Bob",
      "year": 2024,
      "url": "https://...",
      "abstract": "摘要文字",
    },
  ],
}
```

前端 V1 只读，后端已经有 `PATCH /api/user-center/preferences`（登录用户合并更新自己），编辑 UI V2 再接。

### 文档贡献数据源

不走数据库，走 build-time 生成的 `generated/site-leaderboard.json`（`scripts/generate-leaderboard.mjs` 在每次 build 前跑）。前端 SSR 时直接 import，零运行时查询。

理由：贡献数据每次 deploy 才变，不需要实时。真要实时化再迁 Java。

---

## V2 待办

- [ ] `/u/[username]/edit` 编辑页（复用 `PATCH /api/user-center/preferences`）
- [ ] `/api/docs/history` → Java（Caffeine 1h）
- [ ] 个人主页 Zotero pinned_papers 改为存 itemKey，运行时关联 Zotero group API
- [ ] `analyticsEvent` 表如果长期不读取，考虑废弃；若自建 dashboard 再续
