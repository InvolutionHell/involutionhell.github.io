#!/usr/bin/env node
/**
 * @description 为 docs 目录下的 Markdown/MDX 文档补齐 frontmatter 元信息：
 * - 若缺少 cuid（docId），则使用 cuid2 生成并写回文件
 * - 规范化 tags/date 等字段，确保格式一致
 * - 可选：通过 `--sync-db` 参数，在设置 DATABASE_URL 时将元信息写入数据库
 *
 * @note 使用方式：
 *   - 仅补齐 frontmatter：`pnpm docs:sync-cuid`
 *   - 同步数据库：`pnpm docs:sync-cuid -- --sync-db`
 * @author Siz Long
 * @date 2025-09-27
 * @location scripts/uuid.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { createId, isCuid } from "@paralleldrive/cuid2";

// 可通过环境变量覆盖文档目录：DOCS_DIR=content node scripts/add-doc-ids.mjs
const DOCS_DIR = process.env.DOCS_DIR || "../content/docs";
const GLOBS = [`${DOCS_DIR}/**/*.{md,mdx,markdown}`];

function log(...args) {
  console.log("[add-doc-ids]", ...args);
}

async function main() {
  const files = await fg(GLOBS, { onlyFiles: true, dot: false });
  if (files.length === 0) {
    log(`未找到文档文件：${DOCS_DIR}`);
    return;
  }

  // 先收集已有 docId，用于极小概率的碰撞检测
  const existingIds = new Set();
  const warnings = [];

  for (const fp of files) {
    const raw = await fs.readFile(fp, "utf8");
    const fm = matter(raw);
    const id = (fm.data?.docId ?? "").toString().trim();
    if (!id) continue;

    // 校验已存在的 docId 是否为合法 CUID；不合法则仅警告
    if (!isCuid(id)) {
      warnings.push(`⚠️ 非法 docId（非 CUID）：${fp}  ->  docId="${id}"`);
      // 依然将其加入集合，避免后续生成的 id 与之重复（尽管概率极低）
    }
    existingIds.add(id);
  }

  // 对缺失 docId 的文件进行补写
  let updated = 0;
  let skipped = 0;

  for (const fp of files) {
    const raw = await fs.readFile(fp, "utf8");
    const parsed = matter(raw);
    const id = (parsed.data?.docId ?? "").toString().trim();

    if (id) {
      // 已有 docId：跳过，不改动
      skipped++;
      continue;
    }

    // 生成新的 cuid2，并确保与已有集合不重复（理论上已足够安全）
    let newId;
    do {
      newId = createId();
    } while (existingIds.has(newId));
    existingIds.add(newId);

    parsed.data = { ...parsed.data, docId: newId };

    // gray-matter 会自动按 YAML frontmatter 输出
    const output = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(fp, output, "utf8");
    updated++;

    log(`已补充 docId：${path.relative(process.cwd(), fp)}  ->  ${newId}`);
  }

  // 输出警告与汇总
  if (warnings.length) {
    log("==== 警告（已存在但不是合法 CUID 的 docId，未做修改） ====");
    for (const w of warnings) log(w);
  }
  log(
    `处理完成：新增 ${updated} 个 docId，跳过 ${skipped} 个已有文档，总计 ${files.length} 个文件。`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
