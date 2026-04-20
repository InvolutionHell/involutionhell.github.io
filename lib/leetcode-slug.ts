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
