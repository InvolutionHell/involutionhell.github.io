#!/usr/bin/env node
/**
 * @description 通过 GitHub commits API 拉取 app/docs 目录下每个文档的贡献者，
 * 基于数据库已有明细（doc_contributors.last_contributed_at）做【增量累计】，
 * 最终：
 *  1) 累计写回 doc_contributors（只增不减，不删除不出现的旧贡献者）
 *  2) 从明细聚合回 docs.contributor_stats
 *  3) JSON 输出使用聚合后的“累计最终值”，而非本轮快照
 *  4) 生成 contributors.json，结构为：
 *     {
 *       repo,
 *       generatedAt,
 *       docsDir,
 *       totalDocs,
 *       results: [
 *         {
 *           docId,
 *           path,
 *           contributorStats: { githubId: contributions, ... },
 *           contributors: [
 *             { githubId, contributions, lastContributedAt }
 *           ]
 *         }
 *       ]
 *     }
 *
 * 功能要点：
 * - 多路径合并：当前扫描路径 + 历史路径（doc_paths）取并集
 * - 跨路径去重：按 commit.sha 去重，避免重命名/移动导致的重复统计
 * - 增量原则：仅统计“本轮提交时间 > 该作者的 last_contributed_at”的提交数
 * - 只使用 GitHub API，无需本地 git
 *
 * 环境变量/CLI 覆盖：
 * - GITHUB_TOKEN：可选，设置后可提高速率限制
 * - GITHUB_OWNER / GITHUB_REPO：覆盖默认仓库 (InvolutionHell/involutionhell)
 * - DOCS_DIR：相对于仓库根的文档目录（默认值：app/docs）
 * - OUTPUT：输出 JSON 路径（默认：generated/doc-contributors.json）
 * - GITHUB_PER_PAGE：每页 commits 数，1..100，默认 100
 * - --owner= / --repo= / --docs= / --output=
 * - --sync-db=true|false（默认：存在 DATABASE_URL 时启用）
 * - --skip-db 等价于 --sync-db=false
 *
 * 用法：
 *   pnpm exec node scripts/backfill-contributors.mjs
 *
 * 依赖：
 *   pnpm add -D fast-glob gray-matter dotenv
 *   以及生成的 Prisma Client（import 路径见下）
 *
 * @author Siz Long
 * @date 2025-10-07
 * @location scripts/backfill-contributors.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import fg from "fast-glob";
import matter from "gray-matter";
// Prisma7更改到了client.ts
import * as PrismaModule from "../generated/prisma/client.ts";
const PrismaClient =
  PrismaModule.default?.PrismaClient || PrismaModule.PrismaClient;
import pg from "pg";
const { Pool } = pg;
import { PrismaPg } from "@prisma/adapter-pg";

// Node >=18 在 Actions 下自带 fetch；若需兼容性可加 undici，但默认不必。
// import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

// 解析 --key=value 参数（统一小写 key）
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [rawKey, rawValue] = arg.replace(/^--/, "").split("=");
      const key = rawKey.trim().toLowerCase();
      const value = rawValue === undefined ? "true" : rawValue.trim();
      return [key, value];
    }),
);

// 基础配置
const OWNER = args.owner || process.env.GITHUB_OWNER || "InvolutionHell";
const REPO = args.repo || process.env.GITHUB_REPO || "involutionhell";
const DOCS_DIR = args.docs || process.env.DOCS_DIR || "app/docs";
const OUTPUT =
  args.output || process.env.OUTPUT || "generated/doc-contributors.json";
const PER_PAGE = Math.min(
  Math.max(Number(process.env.GITHUB_PER_PAGE) || 100, 1),
  100,
);
const TOKEN = process.env.GITHUB_TOKEN || "";

// 同步 DB 开关：默认有 DATABASE_URL 即启用；--skip-db/--sync-db 控制
const argSyncDb = args["sync-db"];
const shouldSyncDb = (() => {
  if (args["skip-db"] === "true") return false;
  if (argSyncDb === "false") return false;
  if (argSyncDb === "true") return true;
  return Boolean(process.env.DATABASE_URL);
})();

let prisma = null;
if (shouldSyncDb) {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

// 预设
const docsDirAbs = path.resolve(REPO_ROOT, DOCS_DIR);
const outputAbs = path.resolve(REPO_ROOT, OUTPUT);
const headers = {
  "User-Agent": "involutionhell-contrib-backfill-script",
  Accept: "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

// 统一日志
function log(...args) {
  console.log("[backfill-contributors]", ...args);
}

// 规范化成我想让前端读取的模样
function normalizeContributorStats(stats) {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [
      String(key),
      Number(value) || 0,
    ]),
  );
}

// 确保目录
async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

// 列出 docs 里所有 Markdown/MDX 文件
async function listDocFiles() {
  const patterns = ["**/*.{md,mdx,markdown}"];
  const files = await fg(patterns, {
    cwd: docsDirAbs,
    onlyFiles: true,
    dot: false,
  });
  return files
    .map((relative) => ({
      relative,
      absolute: path.join(docsDirAbs, relative),
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

// 解析 frontmatter，取 docId / title / isTranslation
function parseDocFrontmatter(content) {
  const parsed = matter(content);
  const data = parsed.data || {};
  const docId = typeof data.docId === "string" ? data.docId.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";
  // 有 translatedFrom 字段即为翻译版，不计入贡献者统计
  const isTranslation =
    typeof data.translatedFrom === "string" && data.translatedFrom.length > 0;
  return {
    docId: docId || null,
    title: title || null,
    isTranslation,
    frontmatter: data,
  };
}

// 拉取某个“路径”的 commit（分页+rate limit + 错误处理）
async function fetchCommitsForFile(repoRelativePath) {
  const commits = [];
  let page = 1;

  while (true) {
    const url = new URL(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits`,
    );
    url.searchParams.set("path", repoRelativePath);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetch(url, { headers });

    if (res.status === 403) {
      const reset = res.headers.get("x-ratelimit-reset");
      const resetDate = reset
        ? new Date(Number(reset) * 1000).toISOString()
        : "unknown";
      throw new Error(
        `GitHub API rate limit reached (path: ${repoRelativePath}). Resets at ${resetDate}.`,
      );
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to fetch commits for ${repoRelativePath}: ${res.status} ${res.statusText} -> ${text}`,
      );
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    commits.push(...data);

    const link = res.headers.get("link") || "";
    const hasNext = link.split(",").some((part) => part.includes('rel="next"'));
    if (!hasNext) break;
    page += 1;
  }

  return commits;
}

// 多路径抓取并按 sha 去重
async function fetchCommitsForPaths(allPaths) {
  const bySha = new Map(); // sha -> commitObject
  for (const p of allPaths) {
    const commits = await fetchCommitsForFile(p);
    for (const c of commits) {
      const sha = c?.sha;
      if (sha && !bySha.has(sha)) bySha.set(sha, c);
    }
  }
  return Array.from(bySha.values());
}

// 仅用于统计跳过情况（author=null）等
function aggregateContributors(commits) {
  const contributors = new Map();
  let skipped = 0;

  for (const commit of commits) {
    const author = commit?.author; // 这里是 GitHub 账号对象（可能为 null）
    if (!author || typeof author.id !== "number") {
      skipped += 1;
      continue;
    }
    const commitMeta = commit?.commit || {};
    const rawDate = commitMeta?.author?.date || commitMeta?.committer?.date;
    const commitDate = rawDate ? new Date(rawDate) : null;

    if (!contributors.has(author.id)) {
      contributors.set(author.id, {
        githubId: author.id,
        login: author.login || null,
        avatarUrl: author.avatar_url || null,
        htmlUrl: author.html_url || null,
        contributions: 1,
        lastContributedAt: commitDate ? commitDate.toISOString() : null,
      });
    } else {
      const existing = contributors.get(author.id);
      existing.contributions += 1;
      if (commitDate) {
        const previous = existing.lastContributedAt
          ? new Date(existing.lastContributedAt)
          : null;
        if (!previous || commitDate > previous) {
          existing.lastContributedAt = commitDate.toISOString();
        }
      }
    }
  }

  const sorted = Array.from(contributors.values()).sort((a, b) => {
    if (b.contributions !== a.contributions)
      return b.contributions - a.contributions;
    const dateA = a.lastContributedAt ? Date.parse(a.lastContributedAt) : 0;
    const dateB = b.lastContributedAt ? Date.parse(b.lastContributedAt) : 0;
    return dateB - dateA;
  });

  return { contributors: sorted, skipped };
}

// 写 doc_paths（维护历史路径）
async function upsertDocPath(docId, repoRelativePath, title = null) {
  if (!prisma) return;
  await prisma.$transaction(async (tx) => {
    await tx.docs.upsert({
      where: { id: docId },
      create: {
        id: docId,
        path_current: repoRelativePath ?? null,
        title: title ?? null,
      },
      update: {
        path_current: repoRelativePath ?? undefined,
        // title 可按需覆盖，这里默认不强制覆盖
      },
    });
    await tx.doc_paths.upsert({
      where: { doc_id_path: { doc_id: docId, path: repoRelativePath } },
      create: { doc_id: docId, path: repoRelativePath },
      update: {},
    });
  });
}

// 取一组 docId 的历史路径
async function getAllPathsForDocIds(docIds) {
  if (!prisma || docIds.length === 0) return new Map();
  const rows = await prisma.doc_paths.findMany({
    where: { doc_id: { in: docIds } },
    select: { doc_id: true, path: true },
  });
  const map = new Map(); // docId -> Set(paths)
  for (const r of rows) {
    const s = map.get(r.doc_id) ?? new Set();
    s.add(r.path);
    map.set(r.doc_id, s);
  }
  return map;
}

// 增量累计同步（核心）
async function syncResultsToDatabaseIncremental(results) {
  if (!prisma) {
    log("Skipping DB sync：未检测到 DATABASE_URL 或已禁用。");
    return;
  }
  log("开始增量累计同步到数据库……");

  // 按 docId 聚合“本轮的提交时间列表（按用户）”
  const byDocId = new Map();
  for (const r of results) {
    if (r.error || !r.docId) continue;
    const commits = Array.isArray(r._commits) ? r._commits : [];

    const commitsByUser = new Map(); // gidStr -> Date[]
    for (const c of commits) {
      const gid = c?.author?.id;
      if (!Number.isFinite(gid)) continue; // 跳过匿名/未绑定账号
      const iso = c?.commit?.author?.date || c?.commit?.committer?.date;
      if (!iso) continue;
      const arr = commitsByUser.get(String(gid)) ?? [];
      arr.push(new Date(iso));
      commitsByUser.set(String(gid), arr);
    }
    for (const arr of commitsByUser.values()) arr.sort((a, b) => a - b);

    const entry = byDocId.get(r.docId) ?? {
      representativePath: r.filePath ?? null,
      title: r.title ?? null,
      commitsByUser: new Map(),
    };
    // 合并（保持有序）
    for (const [gid, arr] of commitsByUser) {
      const old = entry.commitsByUser.get(gid) ?? [];
      const merged = old.concat(arr).sort((a, b) => a - b);
      entry.commitsByUser.set(gid, merged);
    }
    if (!entry.title && r.title) entry.title = r.title;
    if (r.filePath) entry.representativePath = r.filePath;

    byDocId.set(r.docId, entry);
  }

  // 对每个 docId：读历史明细 -> 只累计“新于 last”的提交 -> 回写明细 -> 聚合回主表
  for (const [docId, payload] of byDocId) {
    const { commitsByUser, representativePath, title } = payload;

    // 确保 docs 行存在（可更新 path/title）
    await prisma.docs.upsert({
      where: { id: docId },
      create: {
        id: docId,
        path_current: representativePath ?? null,
        title: title ?? null,
      },
      update: {
        path_current: representativePath ?? undefined,
        title: title ?? undefined,
      },
    });

    // 读历史明细
    const existing = await prisma.doc_contributors.findMany({
      where: { doc_id: docId },
      select: {
        github_id: true,
        contributions: true,
        last_contributed_at: true,
      },
    });
    const prevMap = new Map(); // gidStr -> { count, last: Date|null }
    for (const row of existing) {
      prevMap.set(String(row.github_id), {
        count: Number(row.contributions) || 0,
        last: row.last_contributed_at
          ? new Date(row.last_contributed_at)
          : null,
      });
    }

    // 对“本轮出现的用户”做增量
    for (const [gidStr, timesAsc] of commitsByUser) {
      const prev = prevMap.get(gidStr) ?? { count: 0, last: null };
      // 只计 prev.last 之后的提交
      const delta = timesAsc.filter((t) => !prev.last || t > prev.last).length;
      const newCount = prev.count + delta;
      const newestThisRound = timesAsc.length
        ? timesAsc[timesAsc.length - 1]
        : null;
      const newLast =
        newestThisRound && (!prev.last || newestThisRound > prev.last)
          ? newestThisRound
          : prev.last;

      await prisma.doc_contributors.upsert({
        where: {
          doc_id_github_id: {
            doc_id: docId,
            github_id: BigInt(gidStr),
          },
        },
        create: {
          doc_id: docId,
          github_id: BigInt(gidStr),
          contributions: newCount,
          last_contributed_at: newLast ?? new Date(),
        },
        update: {
          contributions: newCount,
          last_contributed_at: newLast ?? new Date(),
        },
      });

      prevMap.set(gidStr, { count: newCount, last: newLast ?? prev.last });
    }

    // 没在本轮出现的既有作者：保持不动（不删），满足“累计保留历史”的语义

    // 聚合回 docs.contributor_stats（仅保留 count>0）
    const finalStats = Object.fromEntries(
      Array.from(prevMap.entries())
        .filter(([, v]) => (v?.count ?? 0) > 0)
        .map(([gid, v]) => [gid, v.count]),
    );

    await prisma.docs.update({
      where: { id: docId },
      data: { contributor_stats: finalStats },
    });

    log(`  ✔ docId=${docId} 累计完成：${JSON.stringify(finalStats)}`);
  }

  log("数据库增量累计已完成。");
}

// 主流程
async function main() {
  log(`Scanning docs under: ${path.relative(REPO_ROOT, docsDirAbs)}`);
  const docFiles = await listDocFiles();
  if (docFiles.length === 0) {
    log("No doc files found. Abort.");
    return;
  }

  // 扫描当前文件：收集 docId -> 当前路径集合、以及 docId->title
  const currentDocIdPaths = new Map(); // docId -> Set(paths)
  const titleByDocId = new Map();

  for (const file of docFiles) {
    const repoRelative = path
      .relative(REPO_ROOT, file.absolute)
      .replace(/\\/g, "/");
    const raw = await fs.readFile(file.absolute, "utf8");
    const meta = parseDocFrontmatter(raw);

    if (!meta.docId) {
      log(`  ⚠️ 跳过 ${repoRelative}：缺少 docId`);
      continue;
    }
    // 翻译版（frontmatter 有 translatedFrom）不统计贡献者
    if (meta.isTranslation) {
      log(`  ⏭  跳过翻译版：${repoRelative}`);
      continue;
    }
    const set = currentDocIdPaths.get(meta.docId) ?? new Set();
    set.add(repoRelative);
    currentDocIdPaths.set(meta.docId, set);

    if (!titleByDocId.has(meta.docId) && meta.title) {
      titleByDocId.set(meta.docId, meta.title);
    }

    // 记入 doc_paths（DB 中维护历史路径）
    await upsertDocPath(meta.docId, repoRelative);
  }

  const docIds = Array.from(currentDocIdPaths.keys());
  if (docIds.length === 0) {
    log("No docs with docId found. Abort.");
    return;
  }

  // 历史路径合并
  const historical = await getAllPathsForDocIds(docIds);

  // 按每个 docId 抓取（合并路径+去重）并计算基础统计
  const results = [];
  for (const docId of docIds) {
    const currentSet = currentDocIdPaths.get(docId) ?? new Set();
    const histSet = historical.get(docId) ?? new Set();
    const unionPaths = new Set([...histSet, ...currentSet]);

    if (unionPaths.size === 0) {
      log(`  ⚠️ docId=${docId} 无路径记录，跳过`);
      continue;
    }

    const representativePath =
      currentSet.values().next().value ?? histSet.values().next().value ?? null;
    const title = titleByDocId.get(docId) ?? null;

    let commits = [];
    try {
      commits = await fetchCommitsForPaths(Array.from(unionPaths));
    } catch (err) {
      log(`  ✖ 拉取 commits 失败 (docId=${docId}): ${err.message}`);
      results.push({
        docId,
        title,
        filePath: representativePath,
        allPaths: Array.from(unionPaths),
        error: err.message,
      });
      continue;
    }

    const { contributors, skipped } = aggregateContributors(commits);
    const statsThisRound = Object.fromEntries(
      (contributors || []).map((c) => [String(c.githubId), c.contributions]),
    );

    const commitTimestamps = commits
      .map((c) => c?.commit?.author?.date || c?.commit?.committer?.date)
      .filter(Boolean)
      .map((v) => Date.parse(v))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    // 注意：为了增量计算，携带 _commits 原始数据（仅进程内使用，不写到 JSON）
    results.push({
      docId,
      title,
      filePath: representativePath,
      allPaths: Array.from(unionPaths),
      totalCommits: commits.length,
      skippedCommits: skipped,
      contributorStatsThisRound: statsThisRound, // 仅用于日志
      lastCommitAt: commitTimestamps.length
        ? new Date(commitTimestamps[0]).toISOString()
        : null,
      _commits: commits, // 用于增量（后续不写入 JSON）
      contributorsRaw: contributors,
    });
  }

  // 先做增量写入 DB（如启用）
  if (shouldSyncDb) {
    await syncResultsToDatabaseIncremental(results);
  } else {
    log("未启用数据库同步（无 DATABASE_URL 或已显式禁用）。");
  }

  // 生成最终 JSON：若启用 DB，同步后从 DB 读回累计后的 contributor_stats；
  // 若未启用 DB，则 JSON 退化为“本轮快照 + 基础信息”（无法拿到累计值）。
  const finalJsonResults = [];

  // 批量获取 DB 数据（解决 N+1 问题）
  const docsMap = new Map();
  if (shouldSyncDb) {
    const docIdsToFetch = results.map((r) => r.docId).filter(Boolean);
    const allDocs = await prisma.docs.findMany({
      where: { id: { in: docIdsToFetch } },
      select: {
        id: true,
        contributor_stats: true,
        path_current: true,
        doc_contributors: {
          select: {
            github_id: true,
            contributions: true,
            last_contributed_at: true,
          },
          orderBy: [{ contributions: "desc" }, { last_contributed_at: "desc" }],
        },
      },
    });
    for (const d of allDocs) {
      docsMap.set(d.id, d);
    }
  }

  for (const r of results) {
    if (!r.docId) continue;

    if (shouldSyncDb) {
      const rawMetaById = new Map(
        (r.contributorsRaw ?? [])
          .map((meta) => {
            const githubId =
              meta?.githubId !== undefined && meta?.githubId !== null
                ? String(meta.githubId)
                : meta?.github_id !== undefined && meta?.github_id !== null
                  ? String(meta.github_id)
                  : null;
            if (!githubId) return null;
            return [
              githubId,
              {
                login: meta?.login ?? null,
                avatarUrl: meta?.avatarUrl ?? null,
                htmlUrl: meta?.htmlUrl ?? null,
                lastContributedAt:
                  typeof meta?.lastContributedAt === "string"
                    ? meta.lastContributedAt
                    : meta?.last_contributed_at instanceof Date
                      ? meta.last_contributed_at.toISOString()
                      : null,
              },
            ];
          })
          .filter(Boolean),
      );

      const row = docsMap.get(r.docId);

      const contributorsFromDb = (row?.doc_contributors ?? [])
        .map((contrib) => ({
          githubId:
            contrib.github_id !== null && contrib.github_id !== undefined
              ? contrib.github_id.toString()
              : null,
          contributions: Number(contrib.contributions ?? 0),
          lastContributedAt: contrib.last_contributed_at
            ? new Date(contrib.last_contributed_at).toISOString()
            : null,
        }))
        .filter((item) => item.githubId !== null)
        .map((item) => {
          const meta = rawMetaById.get(item.githubId);
          const fallbackAvatar = item.githubId
            ? `https://avatars.githubusercontent.com/u/${item.githubId}`
            : null;
          const fallbackHtmlUrl = meta?.login
            ? `https://github.com/${meta.login}`
            : null;
          return {
            ...item,
            login: meta?.login ?? null,
            avatarUrl: meta?.avatarUrl ?? fallbackAvatar,
            htmlUrl: meta?.htmlUrl ?? fallbackHtmlUrl,
          };
        });

      finalJsonResults.push({
        docId: r.docId,
        path: row?.path_current ?? r.filePath ?? null,
        contributorStats: normalizeContributorStats(row?.contributor_stats),
        contributors: contributorsFromDb,
      });
    } else {
      const fallbackContributors = (r.contributorsRaw ?? [])
        .map((contrib) => ({
          githubId:
            contrib?.githubId !== undefined && contrib?.githubId !== null
              ? String(contrib.githubId)
              : contrib?.github_id !== undefined && contrib?.github_id !== null
                ? String(contrib.github_id)
                : null,
          contributions: Number(contrib?.contributions ?? 0),
          lastContributedAt:
            typeof contrib?.lastContributedAt === "string"
              ? contrib.lastContributedAt
              : contrib?.last_contributed_at instanceof Date
                ? contrib.last_contributed_at.toISOString()
                : null,
          login: contrib?.login ?? null,
          avatarUrl:
            contrib?.avatarUrl ??
            (contrib?.githubId
              ? `https://avatars.githubusercontent.com/u/${contrib.githubId}`
              : null),
          htmlUrl:
            contrib?.htmlUrl ??
            (contrib?.login ? `https://github.com/${contrib.login}` : null),
        }))
        .filter((item) => item.githubId !== null)
        .sort((a, b) => {
          if (b.contributions !== a.contributions) {
            return b.contributions - a.contributions;
          }
          const timeA = a.lastContributedAt
            ? Date.parse(a.lastContributedAt)
            : 0;
          const timeB = b.lastContributedAt
            ? Date.parse(b.lastContributedAt)
            : 0;
          return timeB - timeA;
        });

      finalJsonResults.push({
        docId: r.docId,
        path: r.filePath ?? null,
        contributorStats: normalizeContributorStats(
          r.contributorStatsThisRound ?? {},
        ),
        contributors: fallbackContributors,
      });
    }
  }

  await ensureParentDir(outputAbs);
  await fs.writeFile(
    outputAbs,
    JSON.stringify(
      {
        repo: `${OWNER}/${REPO}`,
        generatedAt: new Date().toISOString(),
        docsDir: path.relative(REPO_ROOT, docsDirAbs),
        totalDocs: finalJsonResults.length,
        results: finalJsonResults,
      },
      null,
      2,
    ),
  );

  log(
    `Done. Wrote ${finalJsonResults.length} entries to ${path.relative(
      REPO_ROOT,
      outputAbs,
    )} (JSON 使用累计后的最终值${shouldSyncDb ? "" : "（DB 未启用时退化为本轮快照）"}).`,
  );
}

// 兜底
main()
  .catch((error) => {
    console.error("[backfill-contributors] Unexpected error", error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
