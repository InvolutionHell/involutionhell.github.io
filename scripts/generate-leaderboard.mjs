#!/usr/bin/env node
/**
 * @description 从数据库的 doc_contributors 聚合全站贡献者数据，
 * 生成静态的 leaderboard 供排行榜页和首页使用。
 *
 * 用法：
 *   node scripts/generate-leaderboard.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

// 兼容 Prisma client 引入方式
import * as PrismaModule from "../generated/prisma/client.ts";
const PrismaClient =
  PrismaModule.default?.PrismaClient || PrismaModule.PrismaClient;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
// 我们使用 node:fs/promises 的 fs 即可

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT =
  process.env.LEADERBOARD_OUTPUT || "generated/site-leaderboard.json";

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const outputAbs = path.resolve(REPO_ROOT, OUTPUT);

  if (!process.env.DATABASE_URL) {
    console.error(
      "[generate-leaderboard] 未找到 DATABASE_URL，跳过生成排行榜。正在为您生成空榜单以放行构建... | No DATABASE_URL found. Skipping. Generating an empty leaderboard for build pass...",
    );
    await ensureParentDir(outputAbs);
    try {
      // 检查是否已经存在，存在则不覆盖（或者为了容错直接写入空的 array 也行）
      await fs.writeFile(outputAbs, "[]", "utf-8");
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  }

  const rawData = await fs.readFile(
    path.join(__dirname, "../.source/index.ts"),
    "utf-8",
  );
  const docsMap = {};

  // 正则提取所有类似 { info: {"path":"...","absolutePath":"..."}, data: docs_0 } 的节点数据。
  // 在 .source/index.ts 文件底部有一行类似于：
  // export const docs = _runtime.docs<typeof _source.docs>([{ info: ... }, { info: ... }])
  //
  // 正则解析：

  // - `/s`: 允许 `.` 匹配换行符，防备代码被格式化成多行

  // - `export const docs.*=\s*.*?docs>\(\[`: 匹配由 Fumadocs 自动生成的固定代码开头，直到方括号 `[`
  const pagesInfoMatch = rawData.match(
    /export const docs.*=\s*.*?docs>\(\[(.*?)\]\)/s,
  );

  // pagesInfoMatch[1] 代表我们在上方的正则中用括号 (.*?) 提取出来的具体内容（也就是那一大串 {info: ...} 数组字符串）
  if (pagesInfoMatch && pagesInfoMatch[1]) {
    const pagesRaw = pagesInfoMatch[1];
    // 我们利用简单解析获取所有的 path 和大致提取对应的导入行
    const pageItems = pagesRaw.split("}, {");
    for (const item of pageItems) {
      // - `(.*?)`: 捕获方括号内部的所有的对象内容（非贪婪匹配），这一部分就是所有文章的配置数组
      const pathMatch = item.match(/"path":"(.*?)"/);
      if (pathMatch && pathMatch[1]) {
        const docPath = pathMatch[1];
        let title = docPath.replace(/\.mdx?$/, "");
        // 对于 Fumadocs 以及 Next.js 路由，以 index.md/mdx 结尾的文件实际上对应着目录的根路径
        // 所以我们把拼接出的 `/docs/xxx/index` 最后的 `/index` 去掉
        const url = `/docs/${title}`.replace(/\/index$/, "") || "/docs";

        let docIdFromFm = null;
        // 为了获取确切的 title 和 docId，我们需要打开实际的文件获取 frontmatter，
        try {
          const absolutePathMatch = item.match(/"absolutePath":"(.*?)"/);
          if (absolutePathMatch && absolutePathMatch[1]) {
            const content = await fs.readFile(absolutePathMatch[1], "utf-8");

            // 提取 title
            const titleMatch =
              content.match(/^title:\s*(?:'|")?(.*?)(?:'|")?$/m) ||
              content.match(/^#\s+(.*)$/m);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
            }

            // 提取 docId
            const docIdMatch = content.match(
              /^docId:\s*(?:'|")?(.*?)(?:'|")?$/m,
            );
            if (docIdMatch && docIdMatch[1]) {
              docIdFromFm = docIdMatch[1].trim();
            }
          }
        } catch (e) {
          console.error(e);
        }

        // 优先使用 frontmatter 中的 docId 作为键（与数据库中存储的 CUID 对应）
        // 否则回退使用文件路径作为键
        const key = docIdFromFm || docPath.replace(/\.mdx?$/, "");
        docsMap[key] = { title, url };
      }
    }
  }

  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(
    "[generate-leaderboard] 连接数据库以聚合贡献数据... | Connecting to database to aggregate contributions...",
  );

  try {
    // 聚合每一个 github_id 的总贡献量和所有贡献的文章
    const allRecords = await prisma.doc_contributors.findMany();

    const grouped = {};
    for (const record of allRecords) {
      const gid = record.github_id.toString();
      if (!grouped[gid]) {
        grouped[gid] = {
          contributions: 0,
          docs: new Set(),
        };
      }
      grouped[gid].contributions += record.contributions;
      grouped[gid].docs.add(record.doc_id);
    }

    // 格式化输出榜单
    const leaderboard = Object.entries(grouped)
      .filter(([id, data]) => data.contributions > 0)
      .map(([id, data]) => {
        const points = data.contributions * 10; // 每个 commit 暂定 10 分
        const githubId = id;

        const contributedDocsInfo = Array.from(data.docs).map((dbDocId) => {
          // dbDocId 对应数据库里的 CUID (如 psc0xf6oa1m7g8s9wfwiojkf)
          // 或之前的路径 (如 path/to/doc.mdx 需要去除后缀匹配)
          const key = dbDocId.replace(/\.mdx?$/, "");
          const mappedInfo = docsMap[key];

          return {
            id: dbDocId,
            title: mappedInfo ? mappedInfo.title : dbDocId, // 若没有匹配到页面，回退显示 docId
            url: mappedInfo ? mappedInfo.url : `/docs/${key}`,
          };
        });

        return {
          id: githubId,
          // 暂时没有办法直接从表中获取 login_name，我们就以此格式保留并前端展示默认占位符或者使用 github username API 换取 (如果需要完全离线，则只展示ID)
          name: `GitHub User ${githubId}`,
          points: points,
          commits: data.contributions,
          avatarUrl: `https://avatars.githubusercontent.com/u/${githubId}`,
          contributedDocs: contributedDocsInfo,
        };
      })
      .sort((a, b) => b.points - a.points);

    // 为前排用户附带一下 Github API 拉取详细昵称信息，由于只是少数人（例如前100），可以接受构建时拉取。
    console.log(
      `[generate-leaderboard] 已聚合 ${leaderboard.length} 名用户，正在通过 GitHub API 获取前 100 名的详细信息... | Aggregated ${leaderboard.length} users. Annotating top 100 with Github API...`,
    );

    // 读取 GITHUB_TOKEN（由 workflow env 注入，见 .github/workflows/sync-uuid.yml）。
    // 匿名调用 GitHub API 限流 60/hour，带 token 后 5000/hour。没有 token 依然能跑，
    // 只是前 100 基本全部 403，fallback 回 "GitHub User <id>"。
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_PAT || "";
    if (!ghToken) {
      console.warn(
        "[generate-leaderboard] 未检测到 GITHUB_TOKEN/GH_PAT（GitHub token），名字获取会因限流失败，榜单只会展示 id 占位符",
      );
    }

    // 我们在此取前 100 名抓取 Github Name 防止 Rate Limit
    const topUsers = leaderboard.slice(0, 100);
    let successCount = 0;
    let failureCount = 0;
    for (let user of topUsers) {
      try {
        const headers = {
          "User-Agent": "involutionhell-leaderboard-script",
          Accept: "application/vnd.github+json",
        };
        if (ghToken) headers.Authorization = `Bearer ${ghToken}`;
        const ghRes = await fetch(`https://api.github.com/user/${user.id}`, {
          headers,
        });
        if (ghRes.ok) {
          const data = await ghRes.json();
          user.name = data.login || data.name || user.name;
          successCount++;
        } else {
          failureCount++;
          // 首次失败时打印详情帮助定位（限流 / token 过期 / 被 revoke）
          if (failureCount === 1) {
            console.warn(
              `[generate-leaderboard] GitHub API 返回 ${ghRes.status}，后续失败将静默计数。示例响应：`,
              await ghRes.text().then((t) => t.slice(0, 200)),
            );
          }
        }
      } catch (err) {
        failureCount++;
        // 首次网络/DNS/SSL 等异常打印一次错误消息，便于排查；后续静默计数
        if (failureCount === 1) {
          console.warn(
            "[generate-leaderboard] GitHub API 请求异常，后续失败将静默计数。示例错误：",
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
    console.log(
      `[generate-leaderboard] GitHub 名字获取完成：成功 ${successCount} / 失败 ${failureCount}`,
    );

    await ensureParentDir(outputAbs);

    await fs.writeFile(outputAbs, JSON.stringify(leaderboard, null, 2), "utf8");

    console.log(
      `[generate-leaderboard] 排行榜数据已成功写入至 ${OUTPUT} | Successfully wrote leaderboard to ${OUTPUT}`,
    );
  } catch (error) {
    console.error(
      "[generate-leaderboard] 生成排行榜失败： | Failed to generate leaderboard:",
      error,
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
