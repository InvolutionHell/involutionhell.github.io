#!/usr/bin/env node
/**
 * @description 从后端 /api/public/leaderboard 拉聚合贡献数据，
 * 结合本地 .source/index.ts 的 docId→title/url 映射 + git log noreply 反推 login，
 * 生成静态 leaderboard 供排行榜页和首页使用。
 *
 * 历史：早期版本直接 prisma 连 Postgres 5432，逼着 DB 端口公网开放。
 * 现已改走后端 endpoint，DB 收回内网。详见 backend PR #22。
 *
 * 用法：
 *   node scripts/generate-leaderboard.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

/**
 * 从仓库 git log 反推 GitHub id → login 映射，优先走 noreply 邮箱（GitHub 默认启用 privacy）。
 * 格式：
 *   1234567+alice@users.noreply.github.com   → id=1234567, login=alice
 *   alice@users.noreply.github.com           → login=alice（老格式，没 id，只能 name 回填）
 *
 * 这样 build 时不用调 100 次 GitHub API 就能拿到绝大多数贡献者的 login，
 * 只有用真实邮箱提交的（少数）才回退到 GitHub API。
 */
function buildLoginMapFromGitLog() {
  const byId = {}; // github_id → login
  const byLogin = {}; // login → login（用于老格式邮箱的兜底，至少保住 name 字段）
  try {
    // --all 覆盖所有 ref；--no-merges 去掉 merge commit 噪音；%ae 邮箱；%an 展示名
    const out = execSync("git log --all --no-merges --format='%ae%x09%an'", {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    for (const line of out.split("\n")) {
      if (!line) continue;
      const [email] = line.split("\t");
      if (!email) continue;
      // 先匹配带 id 的 noreply： "1234567+alice@users.noreply.github.com"
      const newStyle = email.match(
        /^(\d+)\+([^@\s]+)@users\.noreply\.github\.com$/,
      );
      if (newStyle) {
        byId[newStyle[1]] = newStyle[2];
        byLogin[newStyle[2]] = newStyle[2];
        continue;
      }
      // 老式 noreply： "alice@users.noreply.github.com"（没 id，只能靠 login 反查）
      const oldStyle = email.match(/^([^@\s]+)@users\.noreply\.github\.com$/);
      if (oldStyle) {
        byLogin[oldStyle[1]] = oldStyle[1];
      }
    }
  } catch (e) {
    console.warn(
      "[generate-leaderboard] git log 解析 login 失败（是否不在仓库内？），退回到纯 GitHub API 模式：",
      e instanceof Error ? e.message : e,
    );
  }
  return { byId, byLogin };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT =
  process.env.LEADERBOARD_OUTPUT || "generated/site-leaderboard.json";

// 后端公开聚合接口。优先 LEADERBOARD_API_URL 完整覆盖，否则用 BACKEND_URL 拼，
// 最后兜底生产域名（本地构建无 .env 时也能直接跑）。
const LEADERBOARD_API_URL =
  process.env.LEADERBOARD_API_URL ||
  `${process.env.BACKEND_URL || "https://api.involutionhell.com"}/api/public/leaderboard`;

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

// 后端响应超时上限：Vercel build 单步通常 5min 内，给后端 15s 足够
// （Caffeine 命中是毫秒级，未命中走 JDBC 全表扫描也就秒级）。超时即降级。
const FETCH_TIMEOUT_MS = 15_000;

/**
 * 拉后端聚合数据。任何错误（含超时）都返回 null，让调用方决定降级策略
 * （生成空榜单放行 build vs. 整个失败）。
 *
 * 后端 ApiResponse 形如 { success, message, data }，data 是 LeaderboardEntryDto[]。
 */
async function fetchAggregatedFromBackend() {
  console.log(
    `[generate-leaderboard] 拉聚合数据：${LEADERBOARD_API_URL} | Fetching aggregated contributions from backend...`,
  );
  // AbortController 超时：防止后端 TCP 建立后不返回时 build 无限挂起
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(LEADERBOARD_API_URL, {
      headers: {
        accept: "application/json",
        // UA 用 Chrome 伪装：API 站点走 Cloudflare，CF 默认 Bot Fight Mode 会
        // 把任何含 "bot" / "build" / "script" 关键词的 UA 当机器人拦下，回
        // 403 + "Just a moment..." 挑战页（之前的 UA 就被这么拦了，导致 prod
        // build 拿到 403 走 fallback 写空 leaderboard，feed 卡片全空）。
        // 长期方案应是在 CF 给 /api/public/* 加 "Skip Bot Fight" 规则白名单，
        // 这里的 UA 伪装只是兜底。
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(
        `[generate-leaderboard] 后端返回 ${res.status} ${res.statusText}，body 前 200 字符：`,
        await res.text().then((t) => t.slice(0, 200)),
      );
      return null;
    }
    const json = await res.json();
    // 兼容裸数组（防御）和 ApiResponse 包装
    const data = Array.isArray(json) ? json : json.data;
    if (!Array.isArray(data)) {
      console.error("[generate-leaderboard] 后端响应结构异常：data 不是数组");
      return null;
    }
    return data;
  } catch (err) {
    if (err && err.name === "AbortError") {
      console.error(
        `[generate-leaderboard] 后端响应超时（${FETCH_TIMEOUT_MS}ms），降级为空榜单`,
      );
    } else {
      console.error(
        "[generate-leaderboard] 调用后端失败：",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const outputAbs = path.resolve(REPO_ROOT, OUTPUT);

  const aggregated = await fetchAggregatedFromBackend();

  if (aggregated === null) {
    console.error(
      "[generate-leaderboard] 后端不可用，写入空榜单以放行构建。 | Backend unreachable, writing empty leaderboard to unblock build.",
    );
    // mkdir + writeFile 必须放同一个 try：任一步失败都意味着 generated/site-leaderboard.json
    // 不存在，后续 Next 端 import 会抛更难定位的 ENOENT。这种情况 build 必须 fail-fast，
    // 不能 exit 0 让"看起来一切正常"的 deploy 把站点搞挂。
    try {
      await ensureParentDir(outputAbs);
      await fs.writeFile(outputAbs, "[]", "utf-8");
      process.exit(0);
    } catch (err) {
      console.error(
        "[generate-leaderboard] 写入空榜单失败，无法继续放行构建：",
        err instanceof Error ? err.stack || err.message : err,
      );
      process.exit(1);
    }
  }

  // 构建 docId → {title, url} 映射，从 .source/index.ts 提取（Fumadocs 生成的 manifest）
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

  // 把后端聚合数据转成前端 leaderboard JSON 格式
  // 后端返回：{ githubId, contributions, docIds[], dailyCounts{} }
  // 前端期望：{ id, name, points, commits, avatarUrl, contributedDocs[], dailyCounts }
  const leaderboard = aggregated
    .filter((entry) => entry.contributions > 0)
    .map((entry) => {
      const githubId = entry.githubId.toString();
      const points = entry.contributions * 10; // 每个 commit 暂定 10 分

      const contributedDocsInfo = entry.docIds.map((dbDocId) => {
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
        commits: entry.contributions,
        avatarUrl: `https://avatars.githubusercontent.com/u/${githubId}`,
        contributedDocs: contributedDocsInfo,
        dailyCounts: entry.dailyCounts || {},
      };
    })
    .sort((a, b) => b.points - a.points);

  // Step 1: 先从本地 git log 的 noreply 邮箱反推 id→login，覆盖绝大多数贡献者。
  // 这个是纯本地操作，不打 GitHub API，快且免额度。
  const { byId: loginByGitId } = buildLoginMapFromGitLog();
  let offlineHits = 0;
  for (const user of leaderboard) {
    const login = loginByGitId[user.id];
    if (login) {
      user.name = login;
      offlineHits++;
    }
  }
  console.log(
    `[generate-leaderboard] git log 离线匹配 login：${offlineHits}/${leaderboard.length} 条直接拿到，节省同等数量的 GitHub API 调用`,
  );

  // Step 2: 仍然是 "GitHub User <id>" 占位符的前 100 名才打 GitHub API 兜底
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_PAT || "";
  const topUsers = leaderboard
    .slice(0, 100)
    .filter((u) => u.name === `GitHub User ${u.id}`);

  if (topUsers.length === 0) {
    console.log(
      "[generate-leaderboard] 前 100 名 login 全部命中本地缓存，跳过 GitHub API",
    );
  } else {
    if (!ghToken) {
      console.warn(
        `[generate-leaderboard] 还有 ${topUsers.length} 名用户需要走 GitHub API，但未检测到 GITHUB_TOKEN/GH_PAT，限流 60/hour`,
      );
    } else {
      console.log(
        `[generate-leaderboard] 剩余 ${topUsers.length} 名用户走 GitHub API 兜底 login`,
      );
    }
    let successCount = 0;
    let failureCount = 0;
    for (const user of topUsers) {
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
          if (failureCount === 1) {
            console.warn(
              `[generate-leaderboard] GitHub API 返回 ${ghRes.status}，后续失败将静默计数。示例响应：`,
              await ghRes.text().then((t) => t.slice(0, 200)),
            );
          }
        }
      } catch (err) {
        failureCount++;
        if (failureCount === 1) {
          console.warn(
            "[generate-leaderboard] GitHub API 请求异常，后续失败将静默计数。示例错误：",
            err instanceof Error ? err.message : err,
          );
        }
      }
    }
    console.log(
      `[generate-leaderboard] GitHub API 兜底完成：成功 ${successCount} / 失败 ${failureCount}`,
    );
  }

  await ensureParentDir(outputAbs);
  await fs.writeFile(outputAbs, JSON.stringify(leaderboard, null, 2), "utf8");

  console.log(
    `[generate-leaderboard] 排行榜数据已成功写入至 ${OUTPUT} | Successfully wrote leaderboard to ${OUTPUT}`,
  );
}

main().catch((err) => {
  console.error(
    "[generate-leaderboard] 主流程异常：",
    err instanceof Error ? err.stack || err.message : err,
  );
  process.exit(1);
});
