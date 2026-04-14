import { NextRequest, NextResponse } from "next/server";

// 响应缓存 1 小时，GitHub API 每小时限额 5000 次
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

export interface HistoryItem {
  sha: string;
  authorName: string;
  authorLogin: string;
  avatarUrl: string;
  date: string;
  message: string;
  htmlUrl: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { success: false, error: "缺少 path 参数" },
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

  if (res.status === 403) {
    return NextResponse.json(
      { success: false, error: "GitHub API 限流，请稍后重试" },
      { status: 429 },
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
    authorLogin: c.author?.login ?? c.commit.author.name,
    avatarUrl:
      c.author?.avatar_url ?? `https://github.com/${c.commit.author.name}.png`,
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
