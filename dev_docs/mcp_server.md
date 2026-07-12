# MCP Server

## 目标

本站在 Next.js 内提供 `/api/mcp`，让支持 MCP Streamable HTTP 的客户端直接完成两件事：

- 搜索 `content/docs/**/*.mdx` 中的站内文章；
- 使用已登录用户的凭证发布一篇轻量 Markdown 帖子。

MCP route 与文档站一起部署到 Vercel，不需要增加独立 Node 服务，也不会复制一套内容同步流程。它直接读取构建时生成的 Fumadocs source，并通过 `BACKEND_URL` 调用现有 Spring Boot API。

## Transport 与运行模型

服务端使用 `mcp-handler@1.1.0` 和 `@modelcontextprotocol/sdk@1.26.0`：

- 只开放 Streamable HTTP；
- `sessionIdGenerator` 为 `undefined`，每个请求创建独立 MCP server/transport；
- 关闭 legacy SSE endpoint；
- 不保存 session，不依赖 Redis，可运行在 Vercel serverless；
- `GET /api/mcp` 在 stateless 模式返回 405，`POST /api/mcp` 处理 JSON-RPC。

`POST` 会在进入 `mcp-handler` 前读取并校验原始 body：超过 1 MB 返回 HTTP 413，
非法 JSON 返回 HTTP 400 / JSON-RPC `-32700`。MCP 2025-06-18 起不支持 batch，
所以顶层数组返回 HTTP 400 / JSON-RPC `-32600`，不会交给旧版 SDK 执行。

仓库使用 zod 4。`mcp-handler` README 仍写 zod 3，但它配套的 SDK 1.26.0 已明确兼容 zod 3.25 和 zod 4。本实现固定 SDK 1.26.0 以满足 `mcp-handler@1.1.0` 的精确 peer dependency，并用 zod 4 schema 实测通过了 TypeScript、`tools/list` schema 生成和 `tools/call` 运行时校验，因此没有降级 zod，也没有改用 raw JSON Schema。

## Tool contract

### `search`

输入：

| 字段     | 类型         | 默认值 | 约束                      |
| -------- | ------------ | ------ | ------------------------- |
| `query`  | string       | 无     | 去除首尾空白后 1–200 字符 |
| `locale` | `"zh"\|"en"` | `zh`   | 选择中文或英文索引        |
| `limit`  | integer      | `8`    | 1–20                      |

输出的 `structuredContent.results` 是：

```ts
Array<{
  title: string;
  description: string;
  url: string;
  snippet: string;
}>;
```

`url` 固定为 `https://involutionhell.com` 下的绝对地址。`snippet` 从页面 `structuredData.contents` 中选择与 query 最相关的段落，并截断到 300 字符以内。文本 `content` 同时提供同一批结果，兼容不读取 structured output 的客户端。

搜索索引沿用现有 `/search.zh.json` 和 `/search.en.json` 的数据管线：

1. `source.getPages()`；
2. 按 `isEnglishPage()` 分中文、英文 shard；`lang: en` 或源文件名以 `.en.md` / `.en.mdx` 结尾都视为英文；
3. 使用 `pageToIndex()` 取得 title、description、URL 和 structured data；
4. 中文 shard 使用 Orama Mandarin tokenizer，英文 shard 使用 English language；
5. 查询保持 `threshold: 0.3`、`tolerance: 1`，并按 page 聚合结果；
6. exact phrase 命中的页面优先按 title、description、heading、content 加权重排，
   再补 Orama fuzzy hits，避免短中文词在编辑距离为 1 时被近形词排到前面。

搜索实现和两个 shard 都是 module-level lazy load。同一 lambda 实例第一次搜索时才加载内容 chunk，第一次搜索某种语言时建对应索引，后续请求复用；构建失败会清除 promise，让下次请求重试。

### `publish`

输入：

| 字段          | 类型     | 必填 | 说明                             |
| ------------- | -------- | ---- | -------------------------------- |
| `title`       | string   | 是   | 帖子标题，最多 200 字符          |
| `content_md`  | string   | 是   | Markdown 正文，最多 100,000 字符 |
| `description` | string   | 否   | 摘要，最多 500 字符              |
| `tags`        | string[] | 否   | 最多 10 个，每个最多 50 字符     |
| `slug`        | string   | 否   | 最多 100 字符；不传时由后端生成  |

成功输出 `structuredContent`：

```ts
{
  title: string;
  slug: string;
  url: string;
}
```

MCP route 将字段映射成 `{ title, contentMd, description?, tags?, slug? }`，调用 `POST ${BACKEND_URL}/api/posts`，超时为 10 秒。后端 409 会提示更换 slug；401/403 会提示重新登录取得 satoken；超时和其他错误不会把后端响应体或凭证回显给客户端。

## 鉴权边界

`search` 完全匿名可用。`publish` 要求 MCP HTTP 请求携带：

```http
Authorization: Bearer <satoken>
```

所有凭证读取、`${BACKEND_URL}/auth/me` 校验、MCP `AuthInfo` 生成和后端 header 生成都集中在 `lib/mcp/auth.ts`。只有解析后的 `publish` tool call 才校验 bearer token；initialize、tools/list、search 等请求即使带 bearer header 也匿名执行，不访问鉴权后端。工具只接收“已验证身份 + 后端 headers”，不解析 Authorization，也不记录 token。

当前行为：

- 匿名调用 `search`：正常执行；
- 匿名调用 `publish`：HTTP 401，并返回 `WWW-Authenticate`；
- `publish` 携带无效或过期 token：HTTP 401，并返回同一 `WWW-Authenticate` challenge；
- `publish` 携带有效 token：先调用 `/auth/me`，再执行 `publish`；
- `/auth/me` 超时、网络失败或返回 5xx：HTTP 503 通用错误，提示稍后重试，不把有效凭证误报为无效。`/auth/me` 超时为 10 秒。

`/.well-known/oauth-protected-resource` 已声明 MCP resource、header bearer method 和 `publish` scope。当前后端尚无 OAuth issuer，因此 metadata 不虚构 `authorization_servers`；接入 OAuth 时按升级文档补齐。

sa-token 当前有效期是 30 天。网页端暂时没有安全的 OAuth 授权流程，浏览器类 MCP 客户端默认只使用匿名 `search`；需要 `publish` 时由用户在可信本地客户端显式配置 token。

## 限流

`search` 使用独立的 Upstash sliding window：每 IP 每 60 秒 30 次，key prefix 为 `ratelimit:mcp:search`。环境变量读取顺序与站内现有 limiter 一致：

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`；
- Vercel prefix 变体；
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`。

本地没有 Upstash 环境变量时允许全部请求，并且每个模块实例只打印一次提示。`publish` 依赖登录身份和后端自身保护，不占 search 的额度。

## 本地开发

```bash
corepack pnpm check:pnpm-version
BACKEND_URL=http://localhost:8080 corepack pnpm dev
```

匿名连接 Claude Code：

```bash
claude mcp add --transport http involutionhell https://involutionhell.com/api/mcp
```

需要发布时，将 satoken 放进环境变量，避免写进 shell history：

```bash
read -s INVOLUTIONHELL_SATOKEN
export INVOLUTIONHELL_SATOKEN
claude mcp remove involutionhell
claude mcp add --transport http involutionhell https://involutionhell.com/api/mcp \
  --header "Authorization: Bearer ${INVOLUTIONHELL_SATOKEN}"
```

本地 endpoint 可替换为 `http://localhost:3000/api/mcp`。

## 已知限制

- satoken 最长 30 天，过期后需要重新登录并更新客户端配置；
- 当前没有 OAuth refresh token，不能静默续期；
- web MCP client 在 OAuth 上线前只应开放匿名 search；
- shard 缓存只在单个 lambda 实例内有效，冷启动会重新构建；
- 内容更新随下一次部署进入 MCP index，不是运行时增量索引；
- `publish` 只处理轻量帖子，不上传 cover 或正文图片。
