#!/usr/bin/env node
/**
 * MDX 图片就近迁移脚本（中文注释）
 *
 * 目标
 * - 扫描 `app/[locale]/docs/??/?.mdx`（含 .md）里的图片引用
 * - 对于以 `/images/...` 绝对路径引用且仅被“单一文档”使用的图片：移动到对应 MDX 同目录下的 `images/` 子目录
 * - 同时将文中的绝对路径替换为相对路径 `./images/<文件名>`（站点级资源除外）
 *
 * 为什么需要
 * - 图片与文章就近存放，便于迁移、重命名、归档与协作
 * - 避免公共目录下命名冲突与难以追踪的引用关系
 *
 * 使用方式
 * - 包管理脚本：`pnpm migrate:images`
 * - 直接运行：`node scripts/move-doc-images.mjs`
 *
 * 规则
 * - 保留并忽略站点级绝对路径：`/images/site/*`、`/images/components/*`
 * - 共享图片（被多个文档引用）将保留在 public 中，并保持绝对路径；防止重复与不必要的拷贝
 * - 单一文档引用的图片采用“移动”（rename 或 copy+unlink），避免产生重复副本
 **/

import fs from "fs";
import path from "path";
import crypto from "crypto";

// 仓库根目录、文档目录与 public 目录
const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "app", "[locale]", "docs");
const PUBLIC_DIR = path.join(ROOT, "public");

// 排除不迁移的绝对路径前缀（站点级 & 组件演示级别）
const EXCLUDE_PREFIXES = ["/images/site/", "/images/components/"];

// 需要处理的文档扩展名
const exts = new Set([".mdx", ".md"]);

/** 递归遍历目录，产出文件路径 */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** 确保目录存在（多层级） */
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** 读取文件内容为字符串 */
function read(file) {
  return fs.readFileSync(file, "utf8");
}

/** 简单计算文件 SHA1，用于判等（可避免重复移动时产生副本） */
function sha1(p) {
  const h = crypto.createHash("sha1");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}

/**
 * 构建引用表：统计所有文档对 `/images/...`（排除站点级前缀）的引用次数
 */
function buildRefs() {
  const mdxImg = /!\[[^\]]*\]\(([^)]+)\)/g;
  const htmlImg = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  /** @type {Map<string, Set<string>>} url -> set of files */
  const refs = new Map();
  for (const f of walk(DOCS_DIR)) {
    if (!exts.has(path.extname(f))) continue;
    const content = read(f);
    const urls = new Set();
    for (const m of content.matchAll(mdxImg)) urls.add(m[1]);
    for (const m of content.matchAll(htmlImg)) urls.add(m[1]);
    for (const url of urls) {
      if (!url.startsWith("/images/")) continue;
      if (EXCLUDE_PREFIXES.some((p) => url.startsWith(p))) continue;
      if (!refs.has(url)) refs.set(url, new Set());
      refs.get(url).add(f);
    }
  }
  return refs;
}

/**
 * 处理单个 MD(X) 文件：
 * - 抓取 Markdown 与 HTML 中的图片地址
 * - 对“仅被本文件引用”的 `/images/...` 图片执行移动并替换为相对路径
 */
function moveForFile(file, refs) {
  const raw = fs.readFileSync(file, "utf8");
  let content = raw;
  // Markdown 图片语法：![alt](src)
  const mdxImg = /!\[[^\]]*\]\(([^)]+)\)/g;
  // HTML 图片语法：<img src="..." />
  const htmlImg = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const urls = new Set();
  for (const m of content.matchAll(mdxImg)) urls.add(m[1]);
  for (const m of content.matchAll(htmlImg)) urls.add(m[1]);

  if (urls.size === 0) return { moved: 0, updated: false };
  let moved = 0;
  const dir = path.dirname(file);
  const baseName = path.basename(file, path.extname(file));
  const destDir = path.join(dir, `${baseName}.assets`);

  for (const url of urls) {
    // 仅处理以 /images/ 开头的绝对路径
    if (!url.startsWith("/images/")) continue;
    // 站点级与组件级图片跳过（保持绝对路径）
    if (EXCLUDE_PREFIXES.some((p) => url.startsWith(p))) continue;

    // 若该图片被多个文档引用，则视为“共享图片”，保留绝对路径
    const consumers = refs.get(url);
    if (consumers && consumers.size > 1) {
      continue;
    }

    // 计算 public 下的源文件路径
    const relFromPublic = url.replace(/^\//, "");
    const src = path.join(PUBLIC_DIR, relFromPublic);
    if (!fs.existsSync(src)) {
      console.warn(
        `Skip (not found): ${src} (from ${url}) in ${path.relative(ROOT, file)}`,
      );
      continue;
    }

    // 移动到文章同目录的 images 子目录
    const base = path.basename(src);
    ensureDir(destDir);
    const dest = path.join(destDir, base);
    if (fs.existsSync(dest)) {
      // 若已存在同名文件，尝试比较内容，若相同则删除源文件以避免重复
      try {
        if (sha1(src) === sha1(dest)) {
          fs.unlinkSync(src);
          moved++;
        } else {
          // 内容不同则保留源文件并提示人工处理
          console.warn(
            `Conflict: ${path.relative(ROOT, dest)} already exists with different content.`,
          );
          continue;
        }
      } catch (e) {
        console.warn(`Compare failed for ${src} vs ${dest}: ${e.message}`);
        continue;
      }
    } else {
      // 优先使用 rename，提高效率；跨卷失败则回退为 copy+unlink
      try {
        fs.renameSync(src, dest);
      } catch (e) {
        try {
          fs.copyFileSync(src, dest);
          fs.unlinkSync(src);
        } catch (e2) {
          console.warn(`Move failed for ${src} -> ${dest}: ${e2.message}`);
          continue;
        }
      }
      moved++;
    }

    // 将文中的绝对路径替换为相对路径 ./images/<文件名>
    const rel = `./${baseName}.assets/${base}`;
    // 转义正则中的特殊字符，确保全量替换
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    content = content.replace(re, rel);
  }

  // 额外处理：将历史相对路径 ./images/* 迁移至 ./<basename>.assets/* 并更新引用
  for (const url of urls) {
    if (!url.startsWith("./images/")) continue;
    const absSrc = path.resolve(dir, url);
    if (!fs.existsSync(absSrc)) continue;
    const base = path.basename(absSrc);
    ensureDir(destDir);
    const dest = path.join(destDir, base);
    if (fs.existsSync(dest)) {
      try {
        if (sha1(absSrc) === sha1(dest)) {
          fs.unlinkSync(absSrc);
        } else {
          console.warn(
            `Conflict: ${path.relative(ROOT, dest)} already exists with different content.`,
          );
          continue;
        }
      } catch (e) {
        console.warn(`Compare failed for ${absSrc} vs ${dest}: ${e.message}`);
        continue;
      }
    } else {
      try {
        fs.renameSync(absSrc, dest);
      } catch (e) {
        try {
          fs.copyFileSync(absSrc, dest);
          fs.unlinkSync(absSrc);
        } catch (e2) {
          console.warn(`Move failed for ${absSrc} -> ${dest}: ${e2.message}`);
          continue;
        }
      }
    }
    moved++;
    const newRel = `./${baseName}.assets/${base}`;
    const escapedRel = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reRel = new RegExp(escapedRel, "g");
    content = content.replace(reRel, newRel);
  }

  if (content !== raw) fs.writeFileSync(file, content);
  return { moved, updated: content !== raw };
}

/** 主流程：遍历所有 MDX，累计迁移数量并输出统计 */
function main() {
  let totalFiles = 0;
  let totalMoved = 0;
  // 第一步：构建全局引用表，识别共享图片
  const refs = buildRefs();
  for (const f of walk(DOCS_DIR)) {
    if (!exts.has(path.extname(f))) continue;
    totalFiles++;
    const { moved } = moveForFile(f, refs);
    totalMoved += moved;
  }
  console.log(
    `已处理 ${totalFiles} 个文档，复制 ${totalMoved} 张图片到就近目录。`,
  );
}

main();
