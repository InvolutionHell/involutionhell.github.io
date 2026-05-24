#!/usr/bin/env node
/**
 * check-doc-paths.mjs — PR 中 content/docs/** rename/delete 的 301 覆盖校验
 *
 * 场景
 *   开发者 git mv 或删除 content/docs/ 下的文档文件时，旧 URL 必须有 redirect 兜底，
 *   否则搜索引擎和外部链接会直接 404。这个脚本在 CI 阶段拦截"漏写 redirect"的 PR。
 *
 * 算法
 *   1. git diff 找出本 PR 中被 rename/delete 的 content/docs/** 文件（旧路径）
 *   2. 把旧文件路径转换成归一化 URL（去 content/ 前缀、去语言后缀、去 index）
 *   3. 从 next.config.mjs 提取所有 source 字符串（含 wildcard :path* 规则）
 *   4. 若旧 URL 没有任何 source 覆盖 → 打印错误 + exit 1
 *
 * 用法
 *   GITHUB_BASE_REF=main node scripts/check-doc-paths.mjs   # CI 环境
 *   node scripts/check-doc-paths.mjs                        # 本地，fallback 到 main
 *
 * 豁免
 *   如果文件注释里含有 # no-redirect-needed，该路径跳过检查（用于确认不需要兜底的场景）。
 *   在 next.config.mjs 的 redirects 块里写这个注释即可豁免对应旧路径。
 *
 * 退出码
 *   0  全部旧路径都有 redirect 覆盖（或 PR 无 docs 文件变更）
 *   1  有旧路径缺少 redirect
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE_REF = process.env.GITHUB_BASE_REF ?? "main";

// ── 1. 获取 PR 中被 rename/delete 的 content/docs/** 旧路径 ──────────────────

function getDeletedDocFiles() {
  let output;
  try {
    // --diff-filter=RD：只取 Renamed 和 Deleted
    // --name-status：输出 "R100\told\tnew" 或 "D\tpath"，这样 rename 时能拿到旧路径
    // --name-only 对 rename 只给新路径，无法检查旧 URL，必须用 --name-status
    output = execSync(
      `git diff origin/${BASE_REF}...HEAD --diff-filter=RD --name-status -- 'content/docs/**'`,
      { cwd: ROOT, encoding: "utf-8" },
    ).trim();
  } catch {
    // 没有远端 base ref 时（如本地测试），fallback 到 diff HEAD
    try {
      output = execSync(
        `git diff ${BASE_REF}...HEAD --diff-filter=RD --name-status -- 'content/docs/**'`,
        { cwd: ROOT, encoding: "utf-8" },
      ).trim();
    } catch {
      console.log("⚠️  无法获取 git diff，跳过 doc path 检查");
      process.exit(0);
    }
  }

  if (!output) return [];

  // 解析 --name-status 输出：
  //   "R100\tcontent/docs/old.mdx\tcontent/docs/new.mdx" → 取第二列（旧路径）
  //   "D\tcontent/docs/old.mdx"                          → 取第二列
  const oldPaths = [];
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const status = parts[0]; // "R100", "D", etc.
    if (status.startsWith("R") && parts[1]) {
      // rename：旧路径在第二列
      oldPaths.push(parts[1].trim());
    } else if (status === "D" && parts[1]) {
      // delete：路径在第二列
      oldPaths.push(parts[1].trim());
    }
  }
  return oldPaths.filter((f) => f.startsWith("content/docs/"));
}

// ── 2. 旧文件路径 → 归一化 URL ──────────────────────────────────────────────

/**
 * 把文件路径转为 slug URL：
 *   content/docs/community/dev-tips/git101.mdx  → /docs/community/dev-tips/git101
 *   content/docs/community/dev-tips/git101.en.mdx → /docs/community/dev-tips/git101
 *   content/docs/section/index.mdx               → /docs/section
 *   content/docs/section/index.en.md             → /docs/section
 */
function filePathToUrl(filePath) {
  // 去掉 content/ 前缀
  let url = filePath.replace(/^content\//, "/");

  // 去掉双语后缀 .en.mdx / .en.md / .zh.mdx / .zh.md（顺序重要：先去语言再去扩展名）
  url = url.replace(/\.(en|zh)\.(mdx|md)$/, "");

  // 去掉普通 .mdx / .md 后缀
  url = url.replace(/\.(mdx|md)$/, "");

  // 去掉末尾 /index（index 文件的 URL 是父目录）
  url = url.replace(/\/index$/, "");

  return url;
}

// ── 3. 从 next.config.mjs 提取所有 source 字符串 ────────────────────────────

function extractSources(configPath) {
  const content = fs.readFileSync(configPath, "utf-8");

  // 匹配 source: "..." 或 source: '...'（允许前后有空格）
  const sourceRegex = /source:\s*["']([^"']+)["']/g;
  const sources = [];
  let match;
  while ((match = sourceRegex.exec(content)) !== null) {
    sources.push(match[1]);
  }
  return sources;
}

/**
 * 判断旧 URL 是否被某条 source 规则覆盖。
 *
 * 只处理两种 next.config.mjs 中实际出现的 redirect 模式：
 *   - 精确匹配：source === url
 *   - :path* wildcard：source 以 "/:path*" 结尾 → 前缀匹配
 *
 * 不处理 ":slug(.*)" 之类的复杂参数段 —— 那些是双语文件后缀 redirect（.en/.zh），
 * 和 doc path 覆盖无关，不应被当作通配前缀来误判。
 */
function isCovered(url, sources) {
  for (const source of sources) {
    // 精确匹配
    if (source === url) return true;

    // :path* wildcard："/docs/community/dev-tips/:path*" 覆盖该前缀下的所有子路径
    if (source.endsWith("/:path*")) {
      const prefix = source.slice(0, -"/:path*".length);
      if (url === prefix || url.startsWith(prefix + "/")) return true;
    }
  }
  return false;
}

// ── 4. 检查 no-redirect-needed 豁免注释 ──────────────────────────────────────

/**
 * 如果 next.config.mjs 里存在注释 "# no-redirect-needed: <url>"（或包含该 URL 的行），
 * 则该 URL 豁免检查。格式宽松：只要注释行包含 no-redirect-needed 和该 url 片段即算豁免。
 */
function isExempted(url, configContent) {
  const lines = configContent.split("\n");
  return lines.some(
    (line) =>
      line.includes("no-redirect-needed") &&
      line.includes(url.replace(/^\//, "")),
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

const deletedFiles = getDeletedDocFiles();

if (deletedFiles.length === 0) {
  console.log("✅ check:doc-paths — 无 docs 文件 rename/delete，跳过检查");
  process.exit(0);
}

const configPath = path.join(ROOT, "next.config.mjs");
if (!fs.existsSync(configPath)) {
  console.error("❌ 找不到 next.config.mjs，无法校验 redirect");
  process.exit(1);
}

const configContent = fs.readFileSync(configPath, "utf-8");
const sources = extractSources(configPath);

// 计算旧 URL，去重（双语文件 .en.md 和 .md 会归一化到同一 URL）
const urlSet = new Set();
for (const f of deletedFiles) {
  urlSet.add(filePathToUrl(f));
}

let hasError = false;

for (const url of urlSet) {
  if (isExempted(url, configContent)) {
    console.log(`⏭️  豁免（no-redirect-needed）：${url}`);
    continue;
  }
  if (isCovered(url, sources)) {
    console.log(`✅ redirect 已覆盖：${url}`);
  } else {
    // 找出对应的原始文件路径（可能有多个，如中英文双版本）
    const origFiles = deletedFiles
      .filter((f) => filePathToUrl(f) === url)
      .join(", ");
    console.error(`❌ 缺少 redirect 覆盖：${url}`);
    console.error(`   旧文件：${origFiles}`);
    console.error(
      `   请在 next.config.mjs 加 redirect，或确认此路径无需兜底（加注释 # no-redirect-needed: ${url.replace(/^\//, "")}）`,
    );
    hasError = true;
  }
}

if (hasError) {
  console.error("\n❌ check:doc-paths 未通过，请补充 redirect 后重提 PR");
  process.exit(1);
} else {
  console.log("\n✅ check:doc-paths 通过，所有旧路径均有 redirect 覆盖");
  process.exit(0);
}
