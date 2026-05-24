"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Options } from "react-markdown";

// rehype-sanitize 默认 schema 不含 className，但 rehype-katex 渲染数学公式依赖 className。
// 同时 KaTeX 输出的 MathML 元素（math/annotation 等）也不在默认允许标签里，需手动追加。
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // KaTeX MathML 元素
    "math",
    "annotation",
    "semantics",
    "mrow",
    "mi",
    "mn",
    "mo",
    "msup",
    "msub",
    "msubsup",
    "mfrac",
    "msqrt",
    "mroot",
    "munder",
    "mover",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
    "mtext",
    "mspace",
    "mpadded",
    "menclose",
    "mglyph",
    "mlabeledtr",
    "mphantom",
    "mstyle",
    "merror",
    "mfenced",
    "mmultiscripts",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // 允许所有元素携带 className（rehype-katex / rehype-autolink-headings 需要）
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "style"],
    // KaTeX math 元素的专有属性
    math: ["xmlns", "display"],
    annotation: ["encoding"],
  },
};

const rehypePlugins: Options["rehypePlugins"] = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    // 仅插入图标锚点，不修改标题文本
    { behavior: "append" },
  ],
  rehypeKatex,
  // rehypeSanitize 必须最后运行，防止前面插件注入 XSS payload
  [rehypeSanitize, sanitizeSchema],
];

const remarkPlugins: Options["remarkPlugins"] = [remarkGfm, remarkMath];

interface PostContentProps {
  /** 原始 Markdown 字符串（UGC，来自 posts.content_md） */
  content: string;
  className?: string;
}

/**
 * 运行时 Markdown 渲染器，专用于 UGC posts。
 *
 * 为什么不复用 fumadocs MDX 管道：
 *   - fumadocs 走编译期 remark/rehype，无法在运行时安全渲染任意字符串
 *   - react-markdown 纯运行时，配合 rehypeSanitize 可防 XSS
 *
 * img 处理同 mdx-components.tsx：原生 <img>，不走 Next.js Image（Vercel 配额原因）。
 */
export default function PostContent({ content, className }: PostContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // 与 mdx-components.tsx 保持一致：原生 img，不强制 width/height
          img: ({ src, alt, ...rest }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} {...rest} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
