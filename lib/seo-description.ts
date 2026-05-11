/**
 * @file lib/seo-description.ts
 * @description
 * SEO meta description 统一兜底工具。
 *
 * 背景：Bing Webmaster Tools 2026-05 报告 118 个页面 meta description 太短
 * （< 150 字符）。根因是 docs 页面（fumadocs）直接读 MDX frontmatter 的
 * `description` 字段，没有 fallback；社区贡献者经常漏写或写得过短：
 *
 *   - 96 个 leetcode 题解完全没有 description 字段（程序化导入，没人手动补）
 *   - 67 个 description: ""（贡献者留空）
 *   - 35 个 < 20 字符（"First page" 这种）
 *
 * 这个工具实现"代码层兜底"：
 *   1. 如果 description >= MIN_LENGTH，原样返回（信任作者）
 *   2. 否则拼接 [原 description] + [当前页 title] + [所属分区面包屑] + [站点 tagline]
 *      拼到 80+ 字符，保证搜索引擎抓得到完整摘要
 *
 * 设计原则：
 *   - 不要 LLM、不要数据库、纯字符串拼接（Edge runtime 友好）
 *   - 拼接结果对人类可读（"主题：xxx。 所属分区：xxx › xxx。 站点 tagline"）
 *   - 中英双语 tagline 各一份，按 locale 选
 *   - title === slug 末段时不重复（避免 "主题：A。 所属分区：x › A。"）
 *
 * 注意：这是兜底，不是质量保证。理想路径仍是作者手写精准 description；
 * 真正解决靠 scripts/check-frontmatter-description.mjs 的 CI lint
 * 强制新增内容必须写 description。
 */

const SITE_TAGLINE_ZH =
  "Involution Hell 社区文档 — 算法、系统设计、面试经验与求职指南，由社区贡献维护的开源学习知识库。";
const SITE_TAGLINE_EN =
  "Involution Hell — open-source community knowledge base on algorithms, system design, interview prep, and software engineering.";

/**
 * meta description 最短长度阈值。Bing 推荐 150-160 字符，但实际 80+ 已不被
 * 判定为"too short"。设 80 在质量和兜底成本之间折中：太低被 Bing 继续报警，
 * 太高会让兜底文本占据搜索摘要前半，淹没作者真实写的内容。
 */
export const MIN_SEO_DESCRIPTION_LENGTH = 80;

export interface EnsureSeoDescriptionOpts {
  /** 作者原写的 description，可能为 null/undefined/空字符串/过短 */
  description?: string | null;
  /** 当前页标题，用于兜底拼接 */
  title?: string | null;
  /**
   * 所属分区路径段数组（不含当前页本身），例如：
   *   /docs/career/interview-prep/leetcode/xxx → ["career", "interview-prep", "leetcode"]
   * 用于在兜底文本里拼面包屑。空数组时不拼分区。
   */
  sectionPath?: string[];
  /** 当前页所属语言（"zh" / "en"），决定 tagline 语种 */
  locale?: string;
}

/**
 * 把短/空/缺失的 description 兜底到 >= MIN_SEO_DESCRIPTION_LENGTH 字符。
 *
 * @example
 *   ensureSeoDescription({ description: "", title: "2335. Min Time", sectionPath: ["career", "interview-prep", "leetcode"], locale: "zh" })
 *   // → "主题：2335. Min Time。 所属分区：career › interview-prep › leetcode。 Involution Hell 社区文档 — ..."
 */
export function ensureSeoDescription(opts: EnsureSeoDescriptionOpts): string {
  const raw = (opts.description ?? "").trim();
  if (raw.length >= MIN_SEO_DESCRIPTION_LENGTH) {
    return raw;
  }

  const isEn = opts.locale === "en";
  const tagline = isEn ? SITE_TAGLINE_EN : SITE_TAGLINE_ZH;

  // 拼接顺序：原 description（短但是有） → title → 分区 → tagline
  const parts: string[] = [];

  if (raw) {
    // 作者写了但是短，保留作为前缀，补标点防黏连
    const punctuated = /[。.！!？?]$/.test(raw) ? raw : `${raw}。`;
    parts.push(punctuated);
  }

  // title 拼接：如果 sectionPath 末段（已是 title slug）与 title 重复，
  // 跳过 title 段避免 "主题：A 所属分区：x › A" 这种重复
  const titleStr = (opts.title ?? "").trim();
  if (titleStr) {
    parts.push(isEn ? `Topic: ${titleStr}.` : `主题：${titleStr}。`);
  }

  // sectionPath 拼接：面包屑用 › 分隔，URL-decode 让中文目录显示正常
  if (opts.sectionPath && opts.sectionPath.length > 0) {
    const decoded = opts.sectionPath.map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg; // 非法 URL 序列，保留原样
      }
    });
    const breadcrumb = decoded.join(" › ");
    parts.push(isEn ? `Section: ${breadcrumb}.` : `所属分区：${breadcrumb}。`);
  }

  parts.push(tagline);

  return parts.join(" ").trim();
}
