/**
 * 构建时扫描 app/docs/career/interview-prep/leetcode/*.md(x)，
 * 把「中文/含特殊字符的文件名」→「拼音 slug」的映射写进 generated/leetcode-slug-map.json。
 *
 * 为什么要这个 map：
 *   lib/source.ts 里的 transformer 会把 leetcode 目录下含中文的文件名转成拼音 slug（对外 URL）。
 *   GSC 旧索引里还存着 /docs/CommunityShare/Leetcode/<中文原文件名> 这类 URL，
 *   next.config.mjs 只做了前缀替换 wildcard，slug 没拼音化，跳过去还是 404。
 *   proxy.ts (Next 16 middleware) 要在 edge 端 O(1) 查表把旧 URL 301 到正确拼音路径，
 *   又不能把 pinyin-pro 的整本字典塞进 edge bundle，所以构建时先把映射固化成 JSON。
 *
 * 算法从 lib/leetcode-slug.ts 里 import，运行时和构建时共用同一实现，
 * 消除双点维护。脚本必须用 tsx 执行（见 package.json prebuild）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertSlugToPinyin } from "../lib/leetcode-slug.ts";

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

  const map: Record<string, string> = {};
  const collisions: { stem: string; existing: string; incoming: string }[] = [];

  for (const file of files) {
    const stem = stripSuffix(file);
    const pinyinSlug = convertSlugToPinyin(stem);
    if (pinyinSlug === stem) continue; // 无中文，不需要映射
    if (map[stem] && map[stem] !== pinyinSlug) {
      collisions.push({ stem, existing: map[stem], incoming: pinyinSlug });
    }
    map[stem] = pinyinSlug;
  }

  if (collisions.length) {
    console.warn(
      `[leetcode-slug-map] 检测到 slug 冲突 ${collisions.length} 条:`,
      collisions,
    );
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2) + "\n", "utf8");

  console.log(
    `[leetcode-slug-map] 生成 ${Object.keys(map).length} 条映射 → ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`,
  );
}

main();
