import { pinyin } from "pinyin-pro";

/**
 * 把 leetcode 目录下含中文的文件名 / slug 片段转成纯 ASCII 拼音 slug。
 *
 * 为什么抽出来独立成文件：
 *   1. 运行时 (`lib/source.ts` 里的 transformer) 要用它把 Fumadocs 预生成的 slugs 拼音化
 *   2. 构建时 (`scripts/generate-leetcode-slug-map.mts`) 要用它生成「中文 → 拼音」字面映射
 *      给 proxy.ts 做 301 查表
 *   两处算法必须完全一致，否则 301 跳过去找不到页面。复制粘贴迟早忘记同步，
 *   因此抽成唯一真源。
 *
 * 规则：
 *   - 无中文 → 原样返回（保留纯英文 slug 的连字符、数字等）
 *   - 有中文 → 拼音化 + 去掉所有非 `[a-z0-9]` 字符，再用 `-` 连接
 */
export function convertSlugToPinyin(text: string): string {
  // Fumadocs 内部的 slugs 可能被 encode 过（%E6%BC...），先 decode 再判断汉字
  const decodedText = decodeURIComponent(text);
  if (!/[\u4e00-\u9fa5]/.test(decodedText)) return text;

  return pinyin(decodedText, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
  })
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .join("-");
}

/** leetcode 目录相对 content/docs 的路径（= 对外 URL 里 /docs 之后的固定段）。*/
export const LEETCODE_DIR_SLUG = "career/interview-prep/leetcode";

/**
 * 从 leetcode 目录的文件名列表构建「题号 → 英文 ASCII slug」映射。
 *
 * 英文命名文件（`1234-replace-....en.md`）的 ASCII slug 一定能被 fumadocs 解析、
 * 一定 200；中文翻译文件名经 i18n 解析后的真实 slug 不可预测（带 `. ` 的会塌缩、
 * 带方括号的能独立成拼音页）。所以同一题优先用英文 slug 当 canonical。
 */
export function buildLeetcodeAsciiSlugByNumber(
  filenames: string[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of filenames) {
    if (!/\.(md|mdx)$/i.test(f)) continue;
    const stem = f.replace(/\.(md|mdx)$/i, "").replace(/\.(en|zh)$/i, "");
    if (/[^\x00-\x7f]/.test(stem)) continue; // 含非 ASCII = 中文命名，不是 canonical 来源
    if (/_translated$/i.test(stem)) continue; // 英文名也带 _translated 的极少数
    const num = stem.match(/(\d+)/); // 题号（取第一段数字，兼容 1234- / sword-offer-ii-021）
    if (!num) continue;
    if (!map.has(num[1])) map.set(num[1], stem);
  }
  return map;
}

/**
 * 给一个 leetcode 文件的 stem（已去 locale / 扩展名后缀），算它的真实 canonical URL。
 *
 * 英文页只在 `/en` 渲染（`.en.md`，zh 不回退 en），所以按题号命中英文 slug 时一律
 * 指向 `/en`；命不中（无英文兄弟）才退回 `/zh` 拼音页。`index` 对应目录根。
 */
export function leetcodeCanonicalUrl(
  stem: string,
  asciiByNumber: Map<string, string>,
): string {
  if (stem === "index") return `/zh/docs/${LEETCODE_DIR_SLUG}`;
  const num = stem.match(/(\d+)/);
  const ascii = num ? asciiByNumber.get(num[1]) : undefined;
  if (ascii) return `/en/docs/${LEETCODE_DIR_SLUG}/${ascii}`;
  return `/zh/docs/${LEETCODE_DIR_SLUG}/${convertSlugToPinyin(stem)}`;
}
