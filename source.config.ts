import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";

/**
 * @description: 定义文档根目录
 *
 * 历史：原先 dir 指 "app/docs"，把 mdx 内容直接放在 app router 树下。
 * i18n URL 段化改造（2026-05）后路由迁到 app/[locale]/docs，路由文件
 * （page.tsx / layout.tsx / [...slug]）和 mdx 内容混在 [locale]/docs
 * 不优雅，按 fumadocs 推荐分到 content/docs。
 *
 * Fumadocs 从 content/docs 下递归扫描 .mdx 文件，自动生成 PageTree。
 * 路由仍由 app/[locale]/docs/[...slug]/page.tsx 渲染，base URL 见
 * lib/source.ts 的 loader 配置。
 */
export const docs = defineDocs({
  dir: "content/docs",
});

/**
 * Remark 插件：规范化代码块语言标识符
 * @description: 将所有代码块的语言标识符转为小写，解决 Shiki 不识别大写语言名的问题
 * 例如：```JavaScript → ```javascript
 */
function remarkNormalizeCodeLang() {
  return (tree: Root) => {
    visit(tree, "code", (node) => {
      if (node.lang) {
        // 将语言标识符转为小写
        node.lang = node.lang.toLowerCase();
      }
    });
  };
}

/**
 * Remark 插件：避免双 h1
 *
 * 背景：Bing Webmaster 2026-05 报告 4 个页面有多个 <h1>，仓库里其实
 * 181 / 324 个 MDX 正文都写了 `# 一级标题`。page.tsx 已经渲染了
 * `<h1>{frontmatter.title}</h1>` 作为页面唯一 h1，MDX 正文里再写 `# x`
 * 就形成双 h1，对 SEO/无障碍都是反模式。
 *
 * 不能要求贡献者注意这个约束（markdown 习惯就是 # 当顶级标题），所以
 * 在 build 阶段自动 shift：如果 MDX 含 h1，整树 heading 降一级
 * （h1→h2 / h2→h3 / ... / h5→h6）。这样：
 *   - 贡献者照常写 `# 标题`、`## 章节`、`### 子节`
 *   - 渲染出来变 `<h2>` / `<h3>` / `<h4>`，保持层级关系
 *   - page.tsx 的 `<h1>` 是页面唯一 h1
 *
 * 如果 MDX 不含 h1（作者已经从 ## 开始）就不动 —— 这种文档天然合规。
 *
 * 副作用：MDX 用到 h5 时会被降到 h6；h6 已是 markdown 最大深度无法再降，
 * 这里保留为 h6（罕见，CS/AI 技术文档基本不到 5 层）。
 */
function remarkShiftHeadingIfH1() {
  return (tree: Root) => {
    // 用 visit 遍历整树检测 h1：h1 可能嵌套在 blockquote / list 里
    // （markdown 语法允许 `> # title`），只看 tree.children 顶级会漏掉
    let hasH1 = false;
    visit(tree, "heading", (node) => {
      if (node.depth === 1) hasH1 = true;
    });
    if (!hasH1) return;
    visit(tree, "heading", (node) => {
      if (node.depth < 6) node.depth += 1;
    });
  };
}

/**
 * CRITICAL: Fumadocs 图片处理配置
 *
 * 为什么禁用远程图片尺寸探测（external: false）：
 *
 * 1. Vercel 配额限制
 *    - 网站部署在 Vercel 上，Next.js Image 优化需要消耗配额
 *    - Vercel 免费计划：每月 1000 次源图片优化
 *    - 我们的配额已耗尽，因此在 next.config.mjs 中设置了 unoptimized: true
 *    - 既然不使用 Next.js Image 优化，就没必要在构建时获取远程图片尺寸
 *
 * 2. 网络性能问题
 *    - 国内网络访问 GitHub/Unsplash/Vercel CDN 等图床常常超时
 *    - 离线或 VPN 断线时，本地 dev 会卡很久
 *    - 获取尺寸失败会导致构建时报错：missing required "width" property
 *
 * 3. 编辑器和用户投稿场景
 *    - 编辑器生成的内容和用户投稿都直接使用 ![](url) 语法
 *    - 不包含手动指定的 width/height 属性
 *    - 如果启用远程探测，网络失败时会导致构建失败
 *
 * 影响：
 * - ✅ 构建速度快（无网络请求）
 * - ✅ 不依赖网络状况，构建稳定
 * - ✅ 图片仍然正常显示（通过 <img> 标签）
 * - ⚠️  可能有轻微的布局抖动（CLS），但可以通过 CSS 缓解
 *
 * 相关配置：
 * - next.config.mjs: unoptimized: true（禁用 Next.js 图片优化）
 * - 本文件: external: false（禁用远程尺寸探测）
 *
 * 如果未来：
 * - 升级到 Vercel 付费计划（有更多图片优化配额）
 * - 或迁移到自托管（不受 Vercel 限制）
 * 可以考虑：
 * 1. 在 next.config.mjs 中移除 unoptimized: true
 * 2. 在本文件中设置 external: true
 * 3. 但需要确保网络稳定，或使用环境变量按需控制
 */
const imageOptions = {
  onError: "ignore" as const, // 即使获取尺寸失败也不阻断构建
  external: false as const, // 禁用远程图片尺寸探测（关键配置）
};

/**
 * MDX 全局配置
 *
 * 包含：
 * - remarkMath：启用 Markdown 数学语法支持 ($...$, $$...$$)
 * - remarkNormalizeCodeLang：将代码块语言标识符转为小写（解决 Shiki 大小写问题）
 * - remarkShiftHeadingIfH1：mdx 含 h1 时整树 heading 降一级，避免与 page.tsx 的 h1 冲突
 * - rehypeKatex：使用 KaTeX 将数学公式渲染为 HTML（strict:false 更宽松）
 * - remarkImageOptions：图片处理配置（禁用远程尺寸探测，见上方注释）
 */
export default defineConfig({
  mdxOptions: {
    // 支持 LaTeX 公式 + 规范化代码块 + h1 降级避免双 h1
    remarkPlugins: [
      remarkMath,
      remarkNormalizeCodeLang,
      remarkShiftHeadingIfH1,
    ],

    // 宽松的 KaTeX 渲染，不因轻微语法错误中断
    rehypePlugins: (v) => [[rehypeKatex, { strict: false }], ...v],

    // 图片处理配置（禁用远程尺寸探测）
    remarkImageOptions: imageOptions,
  },
});
