# 轻量发文（Posts 模块）

用户可在 `/editor` 写 Markdown 文章，直接 `POST /api/posts` 落后端数据库，
无需走 Git PR 流程。文章发布后可在 `/feed` 原创 Tab、个人主页 `/u/{username}/posts`
和详情页 `/u/{username}/posts/{slug}` 查看，支持一键发起转正 PR 收录进 `/docs`。

## 数据流

```
浏览器（/editor）
  → POST /api/posts  (next.config.mjs rewrite 透传到后端)
  → Spring Boot /api/posts  (sa-token 鉴权，返回 PostView)
  → 跳转 /u/{username}/posts/{slug}
```

图片上传走独立路径：

```
浏览器粘贴图片
  → POST /api/upload  (Next API Route，非 rewrite)
  → 后端预签名 R2 URL
  → 浏览器 PUT 直传 R2
```

## 关键约束

**Auth Header**：所有 `/api/posts*` 的 fetch 用 `satoken: token`（rewrite 透传，
后端 `sa-token.token-name=satoken` 直接读这个 header 名）。
`/api/upload` 是 Next API Route，客户端用 `x-satoken`，由 route handler 内部翻译。

**BACKEND_URL**：`fetchPosts()`、`fetchPost()` 在 Server Component 里直接调后端，
必须配置 `BACKEND_URL` 环境变量。本地 dev 用 `http://localhost:8081`，
生产用 `https://api.involutionhell.com`。next.config.mjs 的 rewrite fallback 是
`:8080`（生产镜像端口），但 posts 模块只在新后端部署，不依赖 fallback。

## 文件结构

| 文件                                               | 职责                                                  |
| -------------------------------------------------- | ----------------------------------------------------- |
| `app/types/post.ts`                                | PostView / PostSummaryView / PostRequest 类型定义     |
| `app/components/PostContent.tsx`                   | UGC Markdown 渲染（react-markdown + rehype-sanitize） |
| `app/components/PromoteToDocsButton.tsx`           | 三态转正按钮（idle / pending / promoted）             |
| `app/[locale]/editor/EditorPageClient.tsx`         | 编辑器直发逻辑，`buildFrontmatter` 导出给转正按钮复用 |
| `app/[locale]/feed/components/FeedTabSwitcher.tsx` | 原创文章 / 分享链接 Tab 切换（client 组件）           |
| `app/[locale]/feed/components/PostCard.tsx`        | 文章卡片，`showAuthor` prop 控制作者显示              |
| `app/[locale]/feed/page.tsx`                       | /feed 页，默认 Tab=posts，`fetchPosts()` 三次退避     |
| `app/[locale]/u/[username]/posts/`                 | 个人文章列表页（client）+ 详情页（SSR）               |
| `app/[locale]/u/[username]/PostsLinkOnProfile.tsx` | 个人主页文章入口计数                                  |

## /feed Tab 行为

- 无 `?tab` 或 `?tab=posts` → 原创文章（默认）
- `?tab=links` → 分享链接（原有逻辑不变）
- 切换 Tab 时：posts → links 保留 `?category`；links → posts 清空 `?category`

## 转正路径（PromoteToDocsButton）

1. idle → selecting：弹出 DocsDestinationForm 选目标目录
2. selecting → pending：`window.open` 打开 GitHub 新建文件页（预填 frontmatter +
   正文），同时 fire-and-forget `POST /api/posts/{id}/promote`
3. pending → promoted：后端写 `promotedAt`，用户刷新详情页后由 `initialPromoted=true`
   初始化进入 promoted 态

pending 态物理锁死（无 border/hover），不用 `disabled` 属性。

## 路由分类

| 路由                                  | 类型      | 原因                                         |
| ------------------------------------- | --------- | -------------------------------------------- |
| `/[locale]/u/[username]/posts`        | ƒ Dynamic | 客户端组件，读 localStorage token 判定 owner |
| `/[locale]/u/[username]/posts/[slug]` | ƒ Dynamic | SSR，`cache: "no-store"`，内容随时更新       |

两条新路由都是预期的 ƒ Dynamic，不影响已有路由分类。

## 上线检查清单

1. 后端 `feat/posts-module` 和前端 `feat/posts-lightweight-publish` 同步上线
2. 后端 SaTokenConfigure 公开读白名单包含 `GET /api/posts/feed`、
   `GET /api/posts/*/*`（否则匿名用户访问 /feed 和详情页会 401）
3. 生产环境变量 `BACKEND_URL=https://api.involutionhell.com`（Vercel 配置）
4. posts 表随 `SPRING_SQL_INIT_MODE=always` 首次启动自动建表
