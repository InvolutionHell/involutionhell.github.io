#!/usr/bin/env node
/**
 * MDX frontmatter `description` 字段校验脚本
 *
 * 背景
 * - Bing Webmaster Tools 2026-05 报告 118 个页面 meta description 太短。
 * - 根因：fumadocs 的 docs 页面直接读 MDX frontmatter `description`，没兜底；
 *   而 content/docs/ 下 292 个 MDX 里 96 个完全没写 description、67 个写成空字符串、
 *   35 个 < 20 字符。
 * - 代码层兜底已经做了（lib/seo-description.ts），让所有页面 meta description >= 80 字符。
 *   但兜底是"补救"，不是质量保证 —— 兜底版本是模板化拼接，比作者手写的精准内容差。
 *
 * 这个脚本的角色
 * - 在 CI/pre-commit 阶段拦截 **新增/修改** 的 MDX 文件，强制作者手写 description。
 * - 老文件不返工（grandfather）—— 由 Layer 1 代码兜底兜住。
 * - 自动豁免 leetcode/ 目录和 _translated 后缀文件（前者程序化导入太多，后者是机翻产物）。
 *
 * 用法
 *   node scripts/check-frontmatter-description.mjs            # 默认 --changed
 *   node scripts/check-frontmatter-description.mjs --changed  # 只检查 git 已变更的 mdx（PR/pre-commit 用）
 *   node scripts/check-frontmatter-description.mjs --all      # 扫全部，输出统计报表（不退出非 0）
 *   node scripts/check-frontmatter-description.mjs --strict   # 配合 --all 时遇违规退 1（暂不开放，老文件太多）
 *
 * 退出码
 *   0  通过 / 报表模式
 *   1  --changed 模式下发现新增/修改的 MDX 违反规则
 *
 * 接入位置
 *   - .husky/pre-commit  (pnpm check:frontmatter — --changed 模式)
 *   - .github/workflows/content-check.yml (CI PR 检查)
 *
 * 后续可考虑
 *   - 把 leetcode/ 豁免改为"必须用模板生成"，由 Layer 3 的回填脚本保证
 *   - 把 MIN_LENGTH 提到 100 字符（先保守 60 让老贡献者适应）
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "content", "docs");

/**
 * 最短 description 字符数。
 * 60 是保守值：Bing 推荐 150-160，但严苛的话所有新 PR 会被拦。先 60 让贡献者适应。
 * Layer 1 代码兜底会进一步把太短的拼到 80+，所以最终用户看到的搜索摘要不会真的过短。
 */
const MIN_LENGTH = 60;

/**
 * 豁免路径前缀。这些目录下的 MDX 不强制写 description：
 *   - leetcode/: 96 个题解程序化导入，没人会手写；Layer 1 兜底已用 title+面包屑生成可用摘要
 */
const EXEMPT_PATH_PREFIXES = ["content/docs/career/interview-prep/leetcode/"];

/**
 * 豁免文件后缀。
 *   - _translated.md: 机翻产物，原文 description 不一定能直接译过来；豁免后等人工 review 时补
 */
const EXEMPT_FILE_SUFFIXES = ["_translated.md", "_translated.mdx"];

function isExempt(relPath) {
  if (EXEMPT_PATH_PREFIXES.some((p) => relPath.startsWith(p))) return true;
  if (EXEMPT_FILE_SUFFIXES.some((s) => relPath.endsWith(s))) return true;
  return false;
}

/**
 * 解析 mdx 文件返回 { description, hasField }。
 * 用 gray-matter 兼容引号 / 多行 / YAML 边缘 case；正则 dirty parsing 不可靠。
 */
function parseDescription(absPath) {
  const raw = fs.readFileSync(absPath, "utf-8");
  let parsed;
  try {
    parsed = matter(raw);
  } catch (e) {
    return {
      hasField: false,
      description: "",
      parseError: e?.message ?? String(e),
    };
  }
  const data = parsed.data ?? {};
  const hasField = Object.prototype.hasOwnProperty.call(data, "description");
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  return { hasField, description };
}

/**
 * 列出所有 MDX 文件（递归 content/docs/）。
 */
function listAllMdxFiles() {
  const out = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))
      ) {
        out.push(path.relative(ROOT, full));
      }
    }
  }
  if (!fs.existsSync(DOCS_DIR)) return [];
  walk(DOCS_DIR);
  return out;
}

/**
 * 列出当前 PR / pre-commit 阶段已变更的 mdx 文件。
 *
 * pre-commit: git diff --cached 取暂存区
 * GitHub Actions PR: 取 PR head vs base 的 diff（GITHUB_BASE_REF 提供 base 分支）
 * 本地 (无 staged 时)：取 working tree vs HEAD，确保开发期跑也能看到刚改的文件
 */
function listChangedMdxFiles() {
  const candidates = new Set();

  /** 把 git 输出按行加进 candidates；只保留 content/docs 下的 mdx/md */
  const addLines = (raw) => {
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter(
        (l) =>
          l.startsWith("content/docs/") &&
          (l.endsWith(".mdx") || l.endsWith(".md")),
      )
      .forEach((l) => candidates.add(l));
  };

  // Strategy 1: GitHub Actions PR 上下文
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    try {
      // 确保 base 分支引用本地可达（actions/checkout 默认浅克隆）
      execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: "ignore" });
      const out = execSync(
        `git diff --name-only --diff-filter=AM origin/${baseRef}...HEAD`,
        { encoding: "utf-8" },
      );
      addLines(out);
      return [...candidates];
    } catch {
      // 失败回退到本地策略
    }
  }

  // Strategy 2: pre-commit 暂存区
  try {
    const staged = execSync("git diff --cached --name-only --diff-filter=AM", {
      encoding: "utf-8",
    });
    addLines(staged);
  } catch {
    /* 非 git 仓库或无 staged，忽略 */
  }

  // Strategy 3: working tree vs HEAD（本地开发期跑脚本时看刚改未 stage 的文件）
  try {
    const wt = execSync("git diff --name-only --diff-filter=AM HEAD", {
      encoding: "utf-8",
    });
    addLines(wt);
  } catch {
    /* 忽略 */
  }

  return [...candidates];
}

function emitError({ file, message, line = 1 }) {
  // GitHub Actions annotation format，PR 里会显示在文件具体行
  if (process.env.GITHUB_ACTIONS) {
    console.error(`::error file=${file},line=${line}::${message}`);
  } else {
    console.error(`  ✗ ${file}: ${message}`);
  }
}

function emitWarning({ file, message }) {
  if (process.env.GITHUB_ACTIONS) {
    console.warn(`::warning file=${file}::${message}`);
  } else {
    console.warn(`  ⚠ ${file}: ${message}`);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const mode = args.has("--all") ? "all" : "changed";
  const strict = args.has("--strict");

  let files = mode === "all" ? listAllMdxFiles() : listChangedMdxFiles();

  if (files.length === 0) {
    if (mode === "changed") {
      console.log(
        "✅ check:frontmatter — no changed MDX files in content/docs/",
      );
      process.exit(0);
    } else {
      console.log("⚠️  check:frontmatter --all — no MDX files found");
      process.exit(0);
    }
  }

  // 报表统计
  const stats = {
    total: files.length,
    exempt: 0,
    missing: [],
    empty: [],
    short: [],
    ok: 0,
  };

  for (const rel of files) {
    if (isExempt(rel)) {
      stats.exempt++;
      continue;
    }
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const { hasField, description } = parseDescription(abs);
    if (!hasField) {
      stats.missing.push(rel);
    } else if (!description) {
      stats.empty.push(rel);
    } else if (description.length < MIN_LENGTH) {
      stats.short.push({ rel, len: description.length });
    } else {
      stats.ok++;
    }
  }

  const violations =
    stats.missing.length + stats.empty.length + stats.short.length;

  console.log(`\n📋 check:frontmatter (mode=${mode})`);
  console.log(`   scanned: ${stats.total} files`);
  console.log(`   exempt : ${stats.exempt} (leetcode/ + _translated)`);
  console.log(`   ok     : ${stats.ok}`);
  console.log(`   missing description field: ${stats.missing.length}`);
  console.log(`   empty   description     : ${stats.empty.length}`);
  console.log(`   short < ${MIN_LENGTH} chars         : ${stats.short.length}`);

  if (violations === 0) {
    console.log("\n✅ all checked files have description >= " + MIN_LENGTH);
    process.exit(0);
  }

  console.log(`\n🚫 ${violations} file(s) need a longer description:\n`);
  for (const rel of stats.missing) {
    emitError({
      file: rel,
      message: `Missing \`description\` in frontmatter. Add a 60-160 char summary describing what this page covers (used by search engines and AI assistants).`,
    });
  }
  for (const rel of stats.empty) {
    emitError({
      file: rel,
      message: `Frontmatter has \`description: ""\` (empty). Fill in 60-160 chars describing the page topic for SEO.`,
    });
  }
  for (const { rel, len } of stats.short) {
    emitError({
      file: rel,
      message: `\`description\` is too short (${len} chars, need >= ${MIN_LENGTH}). Expand to 60-160 chars summarizing the page.`,
    });
  }

  console.log(
    `\n💡 tip: 在 frontmatter 里加 description: "..." 字段。\n   推荐 60-160 字符，覆盖：本页主题 + 关键技术点 + 适用读者。\n   leetcode/ 目录和 _translated.md 文件自动豁免（由代码层兜底，见 lib/seo-description.ts）。`,
  );

  // changed 模式默认严格；all 模式只在 --strict 下报错
  if (mode === "changed" || strict) {
    process.exit(1);
  }
  process.exit(0);
}

main();
