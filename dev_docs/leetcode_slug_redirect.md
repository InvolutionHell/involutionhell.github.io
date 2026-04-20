# Leetcode 中文 slug 301 重定向

## 为什么需要这东西

`lib/source.ts` 里的 transformer 会把 `app/docs/career/interview-prep/leetcode/` 下含中文的
文件名转成拼音 slug（例如 `2309兼具大小写的最好英文字母_translated.md` 对外变成
`/docs/career/interview-prep/leetcode/2309-jian-ju-...-translated`）。

但历史上 Google Search Console 已经索引了**两批**旧 URL：

1. `/docs/CommunityShare/Leetcode/<中文原文件名>` —— Option C IA 大重组前的旧路径
2. `/docs/CommunityShare/Leetcode/<拼音 slug>` —— 拼音化上线后被 Google 发现但还没编入

`next.config.mjs` 里只写了一条 wildcard `/docs/CommunityShare/Leetcode/:path*` →
`/docs/career/interview-prep/leetcode/:path*`，**只做前缀替换不做 slug 拼音化**。
所以第 1 批 URL 跳到新路径之后 slug 还是中文，目标页依然 404。

GSC 实测 41 条 404 全都是这个问题。

## 现在的方案

**构建时生成字面映射表 + middleware O(1) 查表 301**。选型考虑：

- ❌ 直接在 `next.config.mjs` 里列出来 41 条：手写脆，文件增删没人同步
- ❌ path-to-regexp wildcard 传参：空格 / `[]` / 中文在 Next.js 路由匹配里不稳
- ❌ 在 middleware 里动态跑 `pinyin-pro`：整本字典（~1MB+）塞进 Edge bundle 太大
- ✅ **构建时扫目录 + 输出 JSON，middleware 导入 JSON 查表**：Edge bundle 只多几 KB

## 组件

| 文件                                     | 作用                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `scripts/generate-leetcode-slug-map.mjs` | 扫 leetcode 目录，对含中文的文件名跑和 `lib/source.ts` 一致的拼音化算法，输出 JSON                       |
| `generated/leetcode-slug-map.json`       | 构建产物，`中文 stem → 拼音 stem` 的字面映射（当前 32 条）                                               |
| `proxy.ts` (`redirectLeetcodeIfNeeded`)  | middleware 在 `/docs/CommunityShare/Leetcode/*` 和 `/docs/career/interview-prep/leetcode/*` 上查表并 301 |
| `package.json` `prebuild`                | 构建前自动跑生成脚本，保证 JSON 永远最新                                                                 |

## 覆盖的请求形态

| 输入 pathname                                       | 查表结果 | 最终 301 →                                                       |
| --------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `/docs/CommunityShare/Leetcode/<中文 slug>`         | 命中     | `/docs/career/interview-prep/leetcode/<拼音 slug>`               |
| `/docs/CommunityShare/Leetcode/<ASCII slug>`        | 未命中   | `/docs/career/interview-prep/leetcode/<ASCII slug>`（slug 原样） |
| `/docs/career/interview-prep/leetcode/<中文 slug>`  | 命中     | 同目录拼音 slug                                                  |
| `/docs/career/interview-prep/leetcode/<ASCII slug>` | 未命中   | 放行（不动）                                                     |

## 新增 / 重命名 leetcode 文件时

不需要做任何事。`pnpm build` 的 prebuild 会重跑脚本，JSON 自动同步。

但如果 **pinyin 规则本身要改**（例如 tone、分隔符），必须**同时**改两处：

1. `lib/source.ts` 里的 `convertSlugToPinyin`（运行时给页面生成 slug）
2. `scripts/generate-leetcode-slug-map.mjs` 里的 `convertSlugToPinyin`（构建时给 redirect 生成 slug）

两者算法不同步 = 301 跳过去还是 404。

## 本地验证

```bash
pnpm build
pnpm start            # 默认 3000 端口
# 带中文的旧 URL
curl -I 'http://localhost:3000/docs/CommunityShare/Leetcode/2309%E5%85%BC%E5%85%B7%E5%A4%A7%E5%B0%8F%E5%86%99%E7%9A%84%E6%9C%80%E5%A5%BD%E8%8B%B1%E6%96%87%E5%AD%97%E6%AF%8D_translated'
# 期望：301，Location 指向拼音 slug
```

## GSC 善后

这些 301 上线后，GSC 需要时间重抓：

- 41 条「未找到 (404)」：点「验证修复」→ GSC 会重新爬取，看到 301 就清出 404 列表
- 36 条「已发现 - 尚未编入索引」：这批本来就是**新**拼音 URL，路径没错，只是 Google 还没排到抓取 —— 可以手动「请求编入索引」加速，但没有代码层面要改的
