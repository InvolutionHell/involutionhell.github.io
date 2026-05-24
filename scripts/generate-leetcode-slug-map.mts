/**
 * 构建时扫描 content/docs/career/interview-prep/leetcode/*.md(x)，把「中文文件名」→
 * 「真实 canonical URL」的映射写进 generated/leetcode-slug-map.json。
 *
 * 为什么要这个 map：
 *   GSC 旧索引里还存着 /docs/CommunityShare/Leetcode/<中文原文件名> 和
 *   /docs/career/interview-prep/leetcode/<中文文件名> 这类 URL。中文文件名经
 *   fumadocs i18n 解析后的真实 slug 不可预测（带 `. ` 的会塌缩到英文 slug、带方括号
 *   的能独立成拼音页），手搓拼音对不齐。proxy.ts 要在 edge 端 O(1) 查表把旧 URL
 *   301 到真实页面，又不能把 pinyin-pro 字典塞进 edge bundle，所以构建时固化成 JSON。
 *
 * value 是完整 canonical 路径（含 locale 前缀）：按题号优先指向英文版 /en
 * （.en.md 一定 200），无英文兄弟才退回 /zh 拼音页。算法从 lib/leetcode-slug.ts
 * import，与运行时 transformer / 排行榜生成共用同一真源。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LEETCODE_DIR_SLUG,
  buildLeetcodeAsciiSlugByNumber,
  leetcodeCanonicalUrl,
} from "../lib/leetcode-slug.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LEETCODE_DIR = path.join(
  PROJECT_ROOT,
  "content/docs/career/interview-prep/leetcode",
);
const OUTPUT_FILE = path.join(PROJECT_ROOT, "generated/leetcode-slug-map.json");

/**
 * 从文件名去掉 locale / 扩展名后缀，还原 Fumadocs 会当 slug 的 stem。
 *   2309兼具大小写的最好英文字母_translated.md          → 2309兼具大小写的最好英文字母_translated
 *   2241-design-an-atm-machine.zh.md                 → 2241-design-an-atm-machine
 *   [146]LRU 缓存_translated.md                       → [146]LRU 缓存_translated
 */
function stripSuffix(filename: string): string {
  let stem = filename.replace(/\.(md|mdx)$/i, "");
  stem = stem.replace(/\.(en|zh)$/i, "");
  return stem;
}

function main() {
  if (!fs.existsSync(LEETCODE_DIR)) {
    console.error(`[leetcode-slug-map] 目录不存在: ${LEETCODE_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(LEETCODE_DIR)
    .filter((f) => /\.(md|mdx)$/i.test(f));

  // 题号 → 英文 ASCII slug，给 leetcodeCanonicalUrl 把中文旧 URL 指向英文 canonical
  const asciiByNumber = buildLeetcodeAsciiSlugByNumber(files);

  // byName：当前中文命名文件的精确映射（覆盖无英文兄弟、只能走 zh 拼音页的情况）。
  const byName: Record<string, string> = {};
  for (const file of files) {
    const stem = stripSuffix(file);
    // 只给中文命名文件建映射：英文命名文件本身就是 canonical 目标，不必重定向自己；
    // 纯 ASCII 的 _translated（如 219_translated）真实 slug == stem，旧 URL 直达即可。
    if (!/[^ -~]/.test(stem)) continue;
    byName[stem] = leetcodeCanonicalUrl(stem, asciiByNumber);
  }

  // byNumber：题号 → 英文页。兜住「中文文件已改名成英文、原中文 URL 在 GSC 里还活着」
  // 的情况（如 46.全排列 → 文件已是 46-permutations，byName 里没有，但题号 46 能命中）。
  const byNumber: Record<string, string> = {};
  for (const [num, ascii] of asciiByNumber) {
    byNumber[num] = `/en/docs/${LEETCODE_DIR_SLUG}/${ascii}`;
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ byName, byNumber }, null, 2) + "\n",
    "utf8",
  );

  console.log(
    `[leetcode-slug-map] 生成 byName ${Object.keys(byName).length} 条 + byNumber ${Object.keys(byNumber).length} 条 → ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`,
  );
}

main();
