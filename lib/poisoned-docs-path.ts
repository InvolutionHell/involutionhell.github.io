/**
 * 非 ASCII 的未知 docs 路径在 Vercel 运行时会把中文写进 x-next-cache-tags
 * 响应头导致 500（vercel/next.js#92145，上游未修，见 #370）。合法 docs slug
 * 全是 ASCII——中文 leetcode 旧 URL 由 proxy.ts 的 slug-map 先行 301 成
 * 拼音页，doc_paths 历史表里也没有非 leetcode 的中文行——所以解码后仍含
 * >0xFF 字符（Node header 的 latin1 上限）的 docs 路径必是爬虫垃圾，
 * edge 直接 404。
 *
 * 独立成模块是为了 vitest 可测：proxy.ts 引 next-intl/middleware，
 * node 环境下 import 不动。
 */
export function isPoisonedDocsPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(zh|en)(?=\/)/, "");
  if (!stripped.startsWith("/docs/")) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(stripped); // 防二次编码，对齐 redirectLeetcodeIfNeeded
  } catch {
    return true; // 畸形编码同样进不了 header，一并 404
  }
  return /[^ -ÿ]/.test(decoded);
}
