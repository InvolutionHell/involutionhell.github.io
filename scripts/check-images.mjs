#!/usr/bin/env node
/**
 * MDX 图片路径校验脚本（中文注释）
 *
 * 功能
 * - 扫描 `app/docs/??/?.mdx`（含 .md）
 * - 识别 Markdown `![]()` 与内联 `<img src="…" />` 的图片引用
 * - 强制使用“就近图片”：推荐相对路径（如 `./images/…`）
 * - 仅对站点级共享资源允许绝对路径：`/images/site/*`、`/images/components/*`
 * - 校验图片文件是否存在、文件名是否符合 kebab-case
 *
 * 目的
 * - 图片与文章同目录，便于维护与迁移
 * - 避免全局命名冲突，降低重构成本
 *
 * 使用
 * - 包脚本：`pnpm lint:images`
 * - 直接运行：`node scripts/check-images.mjs`
 *
 * 退出码
 * - 0：通过；1：存在问题（便于接入 CI）
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "app", "docs");
// 允许保留的绝对路径前缀（站点通用/组件演示）
const ALLOWED_ABSOLUTE_PREFIXES = ["/images/site/", "/images/components/"];

// 认定为“图片”的后缀名（忽略大小写）
const IMAGE_FILE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
]);
const exts = new Set([".mdx", ".md"]);

/** Recursively list files */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

/**
 * 推断文档的“路由路径”（仅用于参考/信息）
 */
function toRoutePath(file) {
  const rel = path.relative(DOCS_DIR, file).split(path.sep).join("/");
  const base = path.basename(rel);
  const dir = path.dirname(rel);
  if (base.toLowerCase() === "index.mdx") return dir === "." ? "" : dir;
  const name = base.replace(/\.[^.]+$/, "");
  return dir === "." ? name : `${dir}/${name}`;
}

/**
 * 判断文件名（含扩展名）是否为 kebab-case（仅校验主名，不含后缀）
 * 示例：training-loop.png、fig-01-architecture.webp 为合格
 */
function isKebabCase(name) {
  // allow dot for extension only
  const base = name.replace(/\.[^.]+$/, "");
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base);
}

/**
 * 校验单个 MD(X) 文件中的图片使用：
 * - 非站点级的绝对路径 `/images/*` 会被提示应改为相对路径
 * - 相对路径需位于同一文档目录（避免越级引用）
 * - 检查文件是否存在与命名是否符合 kebab-case
 */
/**
 * 构建全局引用表：统计所有文档对非站点级 `/images/...` 的引用次数
 */
function buildRefs() {
  const reMdx = /!\[[^\]]*\]\(([^)]+)\)/g;
  const reHtml = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  /** @type {Map<string, Set<string>>} */
  const refs = new Map();
  for (const f of walk(DOCS_DIR)) {
    if (!exts.has(path.extname(f))) continue;
    const s = fs.readFileSync(f, "utf8");
    const urls = new Set();
    for (const m of s.matchAll(reMdx)) urls.add(m[1]);
    for (const m of s.matchAll(reHtml)) urls.add(m[1]);
    for (const url of urls) {
      const u = url.replace(/\\/g, "/");
      if (!u.startsWith("/images/")) continue;
      if (ALLOWED_ABSOLUTE_PREFIXES.some((p) => u.startsWith(p))) continue;
      if (!refs.has(u)) refs.set(u, new Set());
      refs.get(u).add(f);
    }
  }
  return refs;
}

function checkFile(file, refs) {
  const content = fs.readFileSync(file, "utf8");
  const routePath = toRoutePath(file);
  const baseDir = path.dirname(file);
  // Markdown 图片语法：![alt](src)
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  // HTML 图片语法：<img src="...">
  const inlineRe = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const problems = [];

  function checkUrl(url, loc) {
    const urlNorm = url.replace(/\\/g, "/");
    if (/^https?:\/\//i.test(urlNorm)) return; // 外链忽略
    // 绝对路径：仅允许站点级前缀；或“确认为被多个文档共享”的图片
    if (urlNorm.startsWith("/images/")) {
      const okAbs =
        ALLOWED_ABSOLUTE_PREFIXES.some((p) => urlNorm.startsWith(p)) ||
        (refs.get(urlNorm)?.size || 0) > 1;
      if (!okAbs) {
        problems.push(
          `${loc}: prefer co-located images; use relative path like ./images/<file> (avoid ${urlNorm})`,
        );
      }
      const fname = urlNorm.split("/").pop() || "";
      if (!isKebabCase(fname))
        problems.push(`${loc}: filename not kebab-case -> ${fname}`);
      return;
    }
    // 相对路径
    if (urlNorm.startsWith("./") || urlNorm.startsWith("../")) {
      const abs = path.resolve(baseDir, urlNorm);
      const relToDocs = path.relative(DOCS_DIR, abs);
      if (relToDocs.startsWith("..")) {
        problems.push(
          `${loc}: image must live within the same doc folder (got ${urlNorm})`,
        );
      }
      const ext = path.extname(abs).toLowerCase();
      if (!IMAGE_FILE_EXTS.has(ext)) return; // 非图片链接跳过
      if (!fs.existsSync(abs)) {
        problems.push(`${loc}: image file not found -> ${urlNorm}`);
      }
      const fname = path.basename(abs);
      if (!isKebabCase(fname))
        problems.push(`${loc}: filename not kebab-case -> ${fname}`);
      return;
    }
    // 其它形式（如 data: 或 import）忽略
  }

  // scan markdown image syntax
  for (const m of content.matchAll(re)) {
    checkUrl(m[1], "mdx");
  }
  // scan inline <img>
  for (const m of content.matchAll(inlineRe)) {
    checkUrl(m[1], "html");
  }

  return problems;
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Docs dir not found: ${DOCS_DIR}`);
    process.exit(1);
  }
  let total = 0;
  let bad = 0;
  const refs = buildRefs();
  for (const f of walk(DOCS_DIR)) {
    if (!exts.has(path.extname(f))) continue;
    total++;
    const probs = checkFile(f, refs);
    if (probs.length) {
      bad++;
      const rel = path.relative(ROOT, f).split(path.sep).join("/");
      console.log(`\n${rel}`);
      for (const p of probs) console.log(`  - ${p}`);
    }
  }
  if (bad) {
    console.log(`\nFound ${bad}/${total} files with image issues.`);
    process.exit(1);
  } else {
    console.log(`Checked ${total} MDX files: no issues.`);
  }
}

main();
