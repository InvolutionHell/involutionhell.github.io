# content/

文档内容（mdx）的根目录。和 `app/` 下的路由文件分离 —— 路由怎么渲染由
`app/[locale]/docs/[...slug]/page.tsx` 决定，这里只放被渲染的内容。

## 子目录

- `docs/` — 全部社区文档。fumadocs 在 build 时从这里递归扫 `.md` / `.mdx`，
  自动生成 PageTree（左侧 sidebar 用）。

## 命名约定

参见 `dev_docs/i18n_url_routing.md` 的「文档命名约定」章节。简单版：

- `xxx.mdx` → 中文（默认 locale）
- `xxx.en.mdx` → 英文翻译
- 不要用 `xxx.zh.mdx`（与无后缀冲突，fumadocs build 会报错）

## 历史

原 mdx 内容混在 `app/docs/` 下（路由 + 内容混居）。2026-05 i18n URL 段化
改造时分离到这里，符合 fumadocs 推荐的 routes / content 分离布局。
GitHub Edit URL（见 `lib/github.ts` 的 `DOCS_BASE`）必须与本目录路径一致。
