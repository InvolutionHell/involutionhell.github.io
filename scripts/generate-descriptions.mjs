#!/usr/bin/env node
/**
 * 离线脚本：为 content/docs/ 下 description 缺失/空/极短的 MDX 文件生成 description。
 *
 * 背景
 * - Bing Webmaster 2026-05 报告 118 个页面 meta description 太短。
 * - Layer 1 代码兜底（lib/seo-description.ts）已经消除 Bing 告警，但兜底文本是
 *   模板化拼接（"主题：xxx。 所属分区：xxx › xxx。 站点 tagline"），语义稀薄。
 * - 这个脚本生成"作者级精准摘要"写回 frontmatter，让搜索结果摘要质量真正提升。
 *
 * 两种生成策略
 *   - LeetCode 题解（content/docs/career/interview-prep/leetcode/*）：模板化生成
 *     `LeetCode {题号}. {题名}（{语言}）— {正文首段摘要} · Involution Hell 社区刷题笔记`
 *     这些是程序化导入的，不调 LLM，速度快、零成本、可重复。
 *
 *   - 其他文档：DeepSeek API 生成 80-130 字符 description
 *     - 输入：title + 正文前 800 字符
 *     - 输出：单行 description，不带引号
 *     - 语言跟随原文（.en.* 后缀用英文，其他用中文）
 *
 * 用法
 *   # dry-run（默认）：生成 scripts/.descriptions-report.json，不动 mdx
 *   node scripts/generate-descriptions.mjs
 *
 *   # 真写回 frontmatter（先 review JSON 报表再跑）
 *   DEEPSEEK_API_KEY=sk-xxx node scripts/generate-descriptions.mjs --apply
 *
 *   # 跳过 LLM，只处理 leetcode 模板（不需要 API key）
 *   node scripts/generate-descriptions.mjs --leetcode-only --apply
 *
 *   # 只看哪些文件会被处理，不调 LLM、不写文件
 *   node scripts/generate-descriptions.mjs --list
 *
 * 安全
 *   - 默认 dry-run，不动 content；--apply 才真写回
 *   - 写回前会保留原 frontmatter 其他字段（gray-matter）
 *   - 重跑幂等：已合格的 description 不动
 *   - DeepSeek 失败的不写，留待重跑
 *
 * 成本估算
 *   - ~158 个文档 * 1000 tokens 输入 / 100 tokens 输出
 *   - DeepSeek chat：约 $0.05 总成本（按 2026-05 价目）
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "content", "docs");
const REPORT_PATH = path.join(ROOT, "scripts", ".descriptions-report.json");

const MIN_LENGTH = 60;
const TARGET_LENGTH_MIN = 80;
const TARGET_LENGTH_MAX = 150;
const BODY_CHARS_FOR_LLM = 800; // 给 LLM 的正文截取长度

const DEEPSEEK_BASE = (
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
).replace(/\/+$/, "");
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

/**
 * 判断文件是否英文页面（.en.{md,mdx} 后缀）
 */
function isEnglishFile(relPath) {
  return /\.en\.(md|mdx)$/i.test(relPath);
}

/**
 * 是否 leetcode 路径
 */
function isLeetcodePath(relPath) {
  return relPath.startsWith("content/docs/career/interview-prep/leetcode/");
}

/**
 * 列出所有 MDX 文件（递归）
 */
function listMdxFiles() {
  const out = [];
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (
        entry.isFile() &&
        (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
      ) {
        out.push(path.relative(ROOT, full));
      }
    }
  })(DOCS_DIR);
  return out;
}

/**
 * 从 mdx 文件读出 frontmatter 和正文
 */
function readMdx(relPath) {
  const abs = path.join(ROOT, relPath);
  const raw = fs.readFileSync(abs, "utf-8");
  const { data, content } = matter(raw);
  return { abs, raw, data: data ?? {}, content: content ?? "" };
}

/**
 * 把正文清洗成纯文本片段（给 LLM 做摘要原料）。
 * 移除：
 *   - import / export 语句
 *   - HTML/MDX 组件标签（<Callout>...</Callout>）
 *   - 代码块（```...```）
 *   - 行内代码 / 链接括号
 *   - 多余空白
 */
function cleanBody(body) {
  let s = body;
  // import/export
  s = s.replace(/^\s*(import|export)\s+.*$/gm, "");
  // 围栏代码块
  s = s.replace(/```[\s\S]*?```/g, "");
  // 行内代码
  s = s.replace(/`[^`\n]+`/g, "");
  // MDX/HTML 标签：循环 replace 直到 stable，避免嵌套残留如 "<<script>>"
  // (单次 replace 后剩 "<script>" 仍含 < — CodeQL js/incomplete-multi-character-sanitization)
  let prev;
  do {
    prev = s;
    s = s.replace(/<[^<>]*>/g, "");
  } while (s !== prev);
  // 图片/链接的 markdown 语法，保留可读文本
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // 多余空白合并
  s = s.replace(/\n{2,}/g, "\n");
  s = s.replace(/[ \t]+/g, " ");
  return s.trim();
}

/**
 * 解析 leetcode 文件名为 { number, slug, lang }
 * 兼容多种命名：
 *   2335-minimum-amount-of-time-to-fill-cups.en.md
 *   93复原Ip地址.md
 *   [1333]餐厅过滤器_translated.md
 *   2131. 连接两字母单词得到的最长回文串.md
 *   9021_TUT_3_25T1.md
 */
function parseLeetcodeFilename(filename) {
  const base = filename
    .replace(/\.(en|zh)\.(md|mdx)$/i, "")
    .replace(/\.(md|mdx)$/i, "");
  // 提取题号：开头连续数字 / [数字] / 数字+点
  let number = null;
  let titleSegment = base;
  const m1 = /^\[?(\d+)\]?[.\s]?(.*)$/.exec(base);
  if (m1) {
    number = m1[1];
    titleSegment = m1[2].trim() || base;
  }
  titleSegment = titleSegment.replace(/[_-]+/g, " ").trim();
  return { number, titleSegment };
}

/**
 * 看起来是题目链接行（如 "[121] xxx" / "121. xxx" / "2251.The xxx.md"）
 * 这些不是描述性内容，跳过。
 */
function looksLikeProblemLinkLine(line) {
  // 以 "数字." / "[数字]" / "数字 " 开头的，且后面短
  return /^\[?\d+\]?[.\s]/.test(line);
}

/**
 * 从清洗后的正文里抓取首句（用 .。!？!？ 切，含一定长度上限）。
 * 跳过 markdown 标题行、链接行、导引行。
 */
function extractFirstSentence(cleanedBody, maxLen = 90) {
  const lines = cleanedBody
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^#{1,6}\s/.test(l)) // markdown 标题
    .filter(
      (l) =>
        !/^(Problem|题目|Description|描述|Topic|leetcode-cn\.com|leetcode\.com|https?:\/\/|topic[:：])/i.test(
          l,
        ),
    )
    .filter((l) => !looksLikeProblemLinkLine(l)) // 题目链接行
    .filter((l) => l.length >= 8); // 太短的行（"#" "Solution" 等）跳过
  if (lines.length === 0) return "";
  const line = lines[0];
  const sub = line.slice(0, maxLen + 30);
  const punctMatch = sub.match(/^[\s\S]{1,90}?[。.！!？?]/);
  if (punctMatch) return punctMatch[0].trim();
  return sub.slice(0, maxLen).trim();
}

/**
 * title 是否已经以题号开头（"1004." / "[1004]" / "1004 "）
 */
function titleStartsWithNumber(title, number) {
  if (!title || !number) return false;
  return new RegExp(`^\\[?${number}\\]?[.\\s．。]`).test(title);
}

/**
 * 模板化生成 leetcode description
 *
 * 关键 case 处理：
 *   - title 已含题号 "1004. Max Consecutive Ones III" → 直接用 title，不加 "LeetCode 1004."
 *   - _translated.md 的 title 是机翻乱码（"Maximum continuity1Number III"）→ 用文件名 parse 出的题号 + slug 作为 display
 *   - 没题号的（如 index.mdx、"counting-stars-inter-uni-programming-contest"）→ 用 title 当 display
 */
function generateLeetcodeDescription({ relPath, data, content }) {
  let rawTitle = (data.title ?? "").trim();
  // title 末尾误带 .md/.mdx（如 "Counting Stars.md"）剥掉
  rawTitle = rawTitle.replace(/\.(md|mdx)$/i, "").trim();

  const filename = path.basename(relPath);
  const isEn = isEnglishFile(relPath);
  const isTranslated = /_translated\.(md|mdx)$/i.test(filename);
  const { number, titleSegment: rawSegment } = parseLeetcodeFilename(filename);
  // titleSegment 清洗：
  //   "translated"        → ""（"1004_translated" 解析出来的无意义）
  //   "xxx translated"    → "xxx"（去掉机翻后缀痕迹）
  let titleSegment = rawSegment ?? "";
  titleSegment = titleSegment
    .replace(/\s*translated\s*$/i, "")
    .replace(/^translated\s*/i, "")
    .trim();

  // rawTitle 可能也以题号开头（"1004.Maximum continuity..."）
  // 当我们要前置题号时，先把 rawTitle 已有的题号前缀剥掉避免重复
  let rawTitleWithoutNumber = rawTitle;
  if (number) {
    rawTitleWithoutNumber = rawTitle
      .replace(new RegExp(`^\\[?${number}\\]?[.\\s．。]?\\s*`), "")
      .trim();
  }

  // title 是否已含 "LeetCode" / "Leetcode" / "题解" / "solution"
  const titleAlreadyMentionsLeetcode = /\bleetcode\b/i.test(rawTitle);
  const titleAlreadyMentionsSolution = /题解|\bsolution\b/i.test(rawTitle);

  let display;
  if (isTranslated) {
    // 机翻 title 不可信，优先用文件名解析的题号+slug；没有再用 title（已去题号）
    const slug = titleSegment || rawTitleWithoutNumber || rawTitle;
    display = number ? `${number}. ${slug}`.trim() : slug.trim();
  } else if (titleStartsWithNumber(rawTitle, number)) {
    display = rawTitle;
  } else if (number) {
    // 文件名有题号但 title 没号 → 拼一起（用 rawTitleWithoutNumber 但 title 不带号时它=rawTitle）
    display = `${number}. ${rawTitle || titleSegment}`.trim();
  } else {
    display = (rawTitle || titleSegment || "").trim();
  }
  display = display.replace(/\s+/g, " ").trim();

  const firstSentence = extractFirstSentence(cleanBody(content));

  // snippet 质量门槛：太短（< 12 字符）或纯标点/纯数字/纯日期的不放，避免出现 "121."、"First encountered:" 这种残段
  const snippetQualified =
    firstSentence &&
    firstSentence.length >= 12 &&
    !/^[\s\d./:'"-]+$/.test(firstSentence);
  const snippet = snippetQualified ? ` — ${firstSentence}` : "";

  if (isEn) {
    let head;
    if (titleAlreadyMentionsLeetcode && titleAlreadyMentionsSolution) {
      head = display;
    } else if (titleAlreadyMentionsLeetcode) {
      head = `${display} — LeetCode notes`;
    } else if (titleAlreadyMentionsSolution) {
      head = `LeetCode ${display}`;
    } else {
      head = `LeetCode ${display} solution`;
    }
    const tail =
      "Involution Hell community problem notebook with approach, complexity analysis, and reference code.";
    return `${head}${snippet} · ${tail}`.slice(0, 220);
  }
  // 中文（含 _translated）
  let head;
  if (titleAlreadyMentionsLeetcode && titleAlreadyMentionsSolution) {
    head = display;
  } else if (titleAlreadyMentionsLeetcode) {
    head = `${display} — 题解`;
  } else if (titleAlreadyMentionsSolution) {
    head = `LeetCode ${display}`;
  } else {
    head = `LeetCode ${display} 题解`;
  }
  const tail =
    "Involution Hell 社区刷题笔记，含完整思路、复杂度分析与参考代码实现。";
  return `${head}${snippet} · ${tail}`.slice(0, 220);
}

/**
 * 调 DeepSeek 生成 description
 */
async function generateWithDeepSeek({
  title,
  body,
  isEn,
  isLeetcode = false,
  filename = "",
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY env var is required. Set it before running --apply (without --leetcode-only).",
    );
  }
  // leetcode 提示词加额外约束：必须以 "LeetCode {题号}." 开头（如果文件名里能提取出题号）
  const leetcodeHint = isLeetcode
    ? isEn
      ? `\nThis is a LeetCode problem solution page. Start the description with "LeetCode {problem number}. {problem title} — " and then explain the approach (DP / sliding window / etc), the data structure used, and any tricks.`
      : `\n这是一个 LeetCode 题解页。Description 以 "LeetCode {题号}. {题名} 题解 — " 开头，然后说明解法（DP / 滑动窗口 / etc）、使用的数据结构、关键技巧。`
    : "";

  const filenameHint = filename
    ? isEn
      ? `\n\nFilename hint (use it to identify the problem number/name if title is mojibake): ${filename}`
      : `\n\n文件名提示（如果 title 是机翻乱码，从文件名提取题号题名）：${filename}`
    : "";

  // 中英文长度单位不同：英文按 char 算 120-160；中文按字算 80-100（显示宽度等同 160-200 英文字符）
  const lengthHint = isEn
    ? "120-160 characters"
    : "80-100 个中文字（不少于 80）";

  const prompt = isEn
    ? `You are writing an SEO meta description for a technical documentation page on involutionhell.com (an open-source CS/AI/career learning community). Write ONE single-line description in English, ${lengthHint}, covering: the page topic, 1-2 key technical points, and who it's for. No quotes. No prefix like "This page". Output ONLY the description text.${leetcodeHint}${filenameHint}

Page title: ${title}
Body (truncated):
${body}`
    : `你在为内卷地狱 involutionhell.com（一个 CS/AI/求职开源学习社区）的技术文档页写 SEO meta description。写一行中文描述，${lengthHint}，覆盖：本页主题 + 1-2 个关键技术点 + 适合谁读。不要带引号。不要"本页介绍"这种废话开头。直接输出描述文本本身。${leetcodeHint}${filenameHint}

页面 title: ${title}
正文片段:
${body}`;

  const res = await fetch(`${DEEPSEEK_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${text}`);
  }
  const json = await res.json();
  const out = (json?.choices?.[0]?.message?.content ?? "").trim();
  // 清洗 LLM 输出：去掉可能的引号、前缀冒号
  return out.replace(/^["'""'']|["'""'']$/g, "").replace(/^[:：]\s*/, "");
}

/**
 * 把字符串编码成 YAML double-quoted scalar。
 * YAML 1.2 双引号字符串语法：
 *   - 必须转义 \ 和 "
 *   - 换行用 \n（但我们的 description 是单行）
 *   - tab 用 \t
 * 这种风格与现有项目大多数 frontmatter 风格兼容（既不折叠也不破坏 lint）。
 */
function yamlDoubleQuoted(s) {
  return (
    '"' +
    s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t") +
    '"'
  );
}

/**
 * Surgical 写回：只动 `description` 那一行（含多行折叠形式），其余 frontmatter 保留原样。
 *
 * 为什么不用 gray-matter stringify：
 *   - js-yaml 输出时会把 "2024.01.01 0:00" 改成 '2024.01.01 0:00'（双引号→单引号）
 *   - ISO 日期 "2026-04-15T12:00:00Z" 会被解析成 Date 再 round-trip 成 "2026-04-15T12:00:00.000Z"
 *   - 长字符串会被自动用 ">-" 折叠语法换行
 *   这些"无意义 yaml 重格式化"会让 git diff 巨大、PR review 困难。
 *
 * 现有 description 的形态可能是：
 *   description: "短"
 *   description: "" 或 description: ''
 *   description: 不带引号的句子
 *   description: >-
 *     第一行
 *     第二行
 *   description: |
 *     ...
 *   (无 description 字段)
 *
 * 处理策略：把 description 字段从首字符到下一个顶级 yaml 键（或 frontmatter 结尾）整段
 * 替换成单行 `description: "..."` 形式。
 */
function writeFrontmatterDescription(relPath, newDescription) {
  const abs = path.join(ROOT, relPath);
  const raw = fs.readFileSync(abs, "utf-8");

  const fmMatch = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
  const newLine = `description: ${yamlDoubleQuoted(newDescription)}`;

  if (!fmMatch) {
    // 没有 frontmatter，整体添加
    const fm = `---\n${newLine}\n---\n\n`;
    fs.writeFileSync(abs, fm + raw, "utf-8");
    return;
  }

  const [, open, body, close, rest] = fmMatch;

  // 在 body 里定位 description 块用**逐行扫描**，不用单一巨型正则：
  // 之前用 /^description:.*(?:\n(?:[ \t]+.*|\s*))*?(?=\n[\w-]+:|$)/m 触发了
  // CodeQL js/redos —— 内层 (?:[ \t]+.*|\s*) 在 \n 上 ambiguous，指数回溯。
  // 改逐行：找 "description:" 起始行，往下吃缩进续行（YAML block scalar /
  // multi-line quoted），遇到下一个顶级 yaml 键（行首 `\w+:`）或 body 结尾停。
  const lines = body.split("\n");
  const TOP_LEVEL_KEY_RE = /^[\w-]+:/; // 顶级 yaml 键的标志
  let descStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("description:")) {
      descStart = i;
      break;
    }
  }

  let newBody;
  if (descStart >= 0) {
    // 找 description 块结束：descStart+1 起，第一行命中顶级键或空行段后再命中顶级键的位置
    let descEnd = descStart;
    for (let i = descStart + 1; i < lines.length; i++) {
      const line = lines[i];
      // 缩进/空行视为 description 续行
      if (line === "" || /^[ \t]/.test(line)) {
        descEnd = i;
        continue;
      }
      // 顶级键出现：description 块到 descEnd 为止
      if (TOP_LEVEL_KEY_RE.test(line)) break;
      // 其他情况（理论上不应该出现）：也归 description 续行兜底
      descEnd = i;
    }
    // 替换 [descStart, descEnd] 这段为单行 newLine
    const before = lines.slice(0, descStart);
    const after = lines.slice(descEnd + 1);
    newBody = [...before, newLine, ...after].join("\n");
  } else {
    // 没有 description 字段，插在首个顶级 yaml 键 + 它的所有续行 之后。
    // 必须跳过续行，否则 title 用 ">-"/"|" 多行 block scalar 时，把
    // description 插到续行中间会破坏 yaml（CodeQL 测过的 case）：
    //   title: >-                    ← 我们找到这行
    //     line 1 of title             ← 续行（缩进）
    //     line 2 of title             ← 续行
    //   description: "新"             ← 必须插这里，不是 title 行后
    //   date: "..."
    let insertAt = 1;
    for (let i = 0; i < lines.length; i++) {
      if (TOP_LEVEL_KEY_RE.test(lines[i])) {
        let endOfFirstKey = i;
        for (let j = i + 1; j < lines.length; j++) {
          const line = lines[j];
          // 缩进或空行视为当前键的续行（block scalar / multi-line quoted）
          if (line === "" || /^[ \t]/.test(line)) {
            endOfFirstKey = j;
            continue;
          }
          // 下一个顶级键出现 → 停
          break;
        }
        insertAt = endOfFirstKey + 1;
        break;
      }
    }
    const newLines = [...lines];
    newLines.splice(insertAt, 0, newLine);
    newBody = newLines.join("\n");
  }

  fs.writeFileSync(abs, open + newBody + close + rest, "utf-8");
}

/**
 * 主流程
 */
async function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const apply = args.has("--apply");
  const leetcodeOnly = args.has("--leetcode-only");
  const listOnly = args.has("--list");
  // --from-report: 读 scripts/.descriptions-report.json，跳过 LLM 调用直接写回 frontmatter。
  // 用于 dry-run 完看完报表后批量 apply，不必为了 apply 再花 12 分钟跑一遍 DeepSeek。
  const fromReport = args.has("--from-report");
  // --limit=N：只跑前 N 个目标。0/未提供 = 全跑。试运行验证 LLM 输出质量用。
  let limit = 0;
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  if (limitArg) limit = parseInt(limitArg.slice("--limit=".length), 10) || 0;

  // --from-report 路径：读已有 report 写回 mdx，不调 LLM、不走 targets 扫描
  if (fromReport) {
    if (!fs.existsSync(REPORT_PATH)) {
      console.error(
        `❌ ${REPORT_PATH} not found. Run a dry-run first to generate the report.`,
      );
      process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
    const items = (report.results ?? []).filter(
      (r) => !r.error && typeof r.after === "string" && r.after.length >= 50,
    );
    console.log(
      `📂 Reading ${REPORT_PATH}: ${items.length} entries with valid description (length >= 50)`,
    );
    if (!apply) {
      console.log(
        "💡 --from-report without --apply is a no-op. Add --apply to write to mdx.",
      );
      return;
    }
    let written = 0;
    let skipped = 0;
    for (const item of items) {
      const abs = path.join(ROOT, item.file);
      if (!fs.existsSync(abs)) {
        console.warn(`  ⚠ file gone: ${item.file}`);
        skipped++;
        continue;
      }
      // 幂等：再次确认当前 description 仍然短/缺失，避免覆盖期间手工编辑过的合格 description
      const { data } = readMdx(item.file);
      const cur =
        typeof data.description === "string" ? data.description.trim() : "";
      if (cur.length >= MIN_LENGTH) {
        skipped++;
        continue;
      }
      writeFrontmatterDescription(item.file, item.after);
      written++;
    }
    console.log(`✅ wrote ${written} file(s), skipped ${skipped}`);
    return;
  }

  const allFiles = listMdxFiles();

  // 找出需要处理的目标
  const targets = [];
  for (const rel of allFiles) {
    const { data, content } = readMdx(rel);
    const cur =
      typeof data.description === "string" ? data.description.trim() : "";
    if (cur.length >= MIN_LENGTH) continue; // 已合格跳过
    if (leetcodeOnly && !isLeetcodePath(rel)) continue;
    targets.push({ rel, data, content, currentDescription: cur });
  }

  console.log(`📂 ${allFiles.length} MDX files scanned`);
  console.log(`🎯 ${targets.length} files need a description`);
  const leetcodeCount = targets.filter((t) => isLeetcodePath(t.rel)).length;
  console.log(`   - leetcode (template): ${leetcodeCount}`);
  console.log(`   - other (LLM)        : ${targets.length - leetcodeCount}`);

  if (listOnly) {
    targets.forEach((t) =>
      console.log(`  ${isLeetcodePath(t.rel) ? "T" : "L"}  ${t.rel}`),
    );
    return;
  }

  // 应用 --limit：截断 targets
  const effectiveTargets = limit > 0 ? targets.slice(0, limit) : targets;
  if (limit > 0) {
    console.log(
      `🧪 --limit=${limit} → processing first ${effectiveTargets.length} only`,
    );
  }

  const results = [];
  let idx = 0;
  for (const t of effectiveTargets) {
    idx++;
    const isLeet = isLeetcodePath(t.rel);
    const isEn = isEnglishFile(t.rel);
    try {
      let suggested;
      let source;
      if (leetcodeOnly) {
        // 离线模板模式：只处理 leetcode，模板拼接，不调 LLM
        if (!isLeet) continue;
        suggested = generateLeetcodeDescription({
          relPath: t.rel,
          data: t.data,
          content: t.content,
        });
        source = "template";
      } else {
        // 默认：所有文件（含 leetcode）走 DeepSeek，质量更稳定一致
        const body = cleanBody(t.content).slice(0, BODY_CHARS_FOR_LLM);
        suggested = await generateWithDeepSeek({
          title: t.data.title ?? "",
          body,
          isEn,
          isLeetcode: isLeet,
          filename: path.basename(t.rel),
        });
        source = `deepseek:${DEEPSEEK_MODEL}`;
      }
      results.push({
        file: t.rel,
        before: t.currentDescription,
        after: suggested,
        source,
        length: suggested.length,
      });
      process.stdout.write(
        `[${idx}/${effectiveTargets.length}] ${source} ${t.rel} (${suggested.length} chars)\n`,
      );
      // 写回阈值：>= 50 字符就接受（中文 50 char ≈ 显示宽度 100 英文字符，对 Bing 足够）
      // 不到的留在 report 里标记，避免静默写入太短的 SEO 描述。
      const acceptLen = 50;
      if (apply && suggested.length >= acceptLen) {
        writeFrontmatterDescription(t.rel, suggested);
      }
    } catch (e) {
      results.push({
        file: t.rel,
        before: t.currentDescription,
        error: e?.message ?? String(e),
      });
      console.error(`  ✗ ${t.rel}: ${e?.message ?? e}`);
    }
  }

  // 报告写盘
  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: apply ? "apply" : "dry-run",
        leetcodeOnly,
        total: results.length,
        applied: apply
          ? results.filter((r) => !r.error && r.after && r.after.length >= 50)
              .length
          : 0,
        skippedTooShort: results.filter(
          (r) => !r.error && r.after && r.after.length < 50,
        ).length,
        errors: results.filter((r) => r.error).length,
        results,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`\n📝 report: ${path.relative(ROOT, REPORT_PATH)}`);
  if (apply) {
    console.log(
      `✅ wrote frontmatter to ${results.filter((r) => !r.error).length} file(s)`,
    );
  } else {
    console.log(
      "💡 dry-run only. Review the report, then re-run with --apply to write to mdx.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
