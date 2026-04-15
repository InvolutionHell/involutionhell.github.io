import { NextRequest, NextResponse } from "next/server";
import type { HistoryItem } from "@/app/types/docs-history";

// 响应缓存 1 小时，GitHub API 每小时限额 5000 次（authenticated）
export const revalidate = 3600;

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

/**
 * 规范化前端传入的文档路径为仓库根相对路径（GitHub API 要求）。
 *
 * 接受的输入形态：
 * - `app/docs/ai/...`（仓库根相对）→ 原样返回
 * - `docs/ai/...` → 前面补 `app/`
 * - `/docs/ai/...`（浏览器 URL 风格）→ 去开头斜杠再补 `app/`
 *
 * 拒绝：含 `..`、反斜杠、null 字节；最终不落在 `app/docs/` 下的路径一律拒绝，
 * 避免用服务端 GITHUB_TOKEN 被动泄露仓库内任意文件的 commit 信息。
 */
function normalizeDocsPath(raw: string): string | null {
  if (!raw) return null;
  // 路径穿越 / 反斜杠 / null 字节 直接拒
  if (raw.includes("..") || raw.includes("\\") || raw.includes("\0")) {
    return null;
  }

  let normalized = raw;
  // URL 风格 /docs/... → docs/...
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }
  // docs/... → app/docs/...
  if (normalized.startsWith("docs/")) {
    normalized = `app/${normalized}`;
  }
  // fumadocs 的 page.file.path 返回"相对 app/docs/"路径（如 ai/xxx/index.mdx）
  // 而不是仓库根。这里补上前缀，和 page.tsx 传参保持兼容。
  if (!normalized.startsWith("app/")) {
    normalized = `app/docs/${normalized}`;
  }
  // 必须落在 app/docs/ 下才放行
  if (!normalized.startsWith("app/docs/")) {
    return null;
  }
  return normalized;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path");

  const path = rawPath ? normalizeDocsPath(rawPath) : null;
  if (!path) {
    return NextResponse.json(
      {
        success: false,
        error: "缺少合法的 path 参数（仅允许 app/docs/ 路径）",
      },
      { status: 400 },
    );
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "服务端未配置 GITHUB_TOKEN" },
      { status: 500 },
    );
  }

  const apiUrl = `https://api.github.com/repos/InvolutionHell/involutionhell/commits?path=${encodeURIComponent(path)}&per_page=5`;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // Next.js fetch 缓存，与 revalidate 配合
      next: { revalidate: 3600 },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "无法连接 GitHub API" },
      { status: 502 },
    );
  }

  // 403 可能是限流、也可能是 token 权限不足 / 仓库不可访问；用 x-ratelimit-remaining 区分
  if (res.status === 403) {
    const rateRemaining = res.headers.get("x-ratelimit-remaining");
    if (rateRemaining === "0") {
      return NextResponse.json(
        { success: false, error: "GitHub API 限流，请稍后重试" },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { success: false, error: "GitHub API 403（可能 token 权限不足）" },
      { status: 403 },
    );
  }

  if (res.status === 401) {
    return NextResponse.json(
      { success: false, error: "GitHub token 无效或过期" },
      { status: 401 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: `GitHub API 返回 ${res.status}` },
      { status: 502 },
    );
  }

  const commits: GitHubCommit[] = await res.json();

  const data: HistoryItem[] = commits.map((c) => ({
    sha: c.sha,
    authorName: c.commit.author.name,
    // author 为 null 时（commit 作者邮箱未关联 GitHub 账号），login 退回展示名
    authorLogin: c.author?.login ?? c.commit.author.name,
    // commit.author.name 是展示名（可能含中文/空格），拼 github.com/<name>.png 容易 404；
    // 仅在有真实 author 时用其 avatar_url，否则返回空串让前端用占位资源
    avatarUrl: c.author?.avatar_url ?? "",
    date: c.commit.author.date,
    // 只取 commit message 第一行
    message: c.commit.message.split("\n")[0],
    htmlUrl: c.html_url,
  }));

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
