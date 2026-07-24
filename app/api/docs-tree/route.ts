/**
 * @description: 获取文档树
 * 该文件后期可以通过Fumadocs的API替代，但也可以保留以方便拓展
 * @returns {Promise<NextResponse>}
 */
import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";
// 采用 force-static，使该接口在 Vercel 构建 (Build) 时直接生成静态结果，后续所有访问永远不再消耗 CPU，直到下次由于发版重新构建。

type DirNode = {
  name: string;
  path: string; // relative to docs root
  children?: DirNode[];
};

type Diag = {
  cwd: string;
  node: string;
  hasFs: boolean;
  candidates: string[];
  envHints: {
    NEXT_RUNTIME: string | null;
    NODE_ENV: string | null;
  };
};

function hasFs() {
  try {
    return (
      typeof fs.readdirSync === "function" &&
      typeof fs.existsSync === "function"
    );
  } catch {
    return false;
  }
}

async function safeListDir(
  dir: string,
): Promise<{ entries: fs.Dirent[]; error?: string }> {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    return { entries };
  } catch (e) {
    return { entries: [], error: String(e) };
  }
}

async function buildTree(
  root: string,
  maxDepth = 2,
  rel = "",
): Promise<DirNode[]> {
  const { entries, error } = await safeListDir(root);
  if (error) throw new Error(`readdir failed at ${root}: ${error}`);

  const dirs = entries.filter((d) => d.isDirectory());

  // 并行处理所有子目录以提高 I/O 效率
  const nodePromises = dirs.map(async (e) => {
    if (e.name.startsWith(".") || e.name.startsWith("[")) return null;
    const abs = path.join(root, e.name);
    const nodeRel = rel ? `${rel}/${e.name}` : e.name;
    const node: DirNode = { name: e.name, path: nodeRel };
    if (maxDepth > 1) {
      // 递归构建子树
      node.children = await buildTree(abs, maxDepth - 1, nodeRel);
    }
    return node;
  });

  // 等待所有并行任务完成，并过滤掉被忽略的目录
  const nodes = (await Promise.all(nodePromises)).filter(
    (n): n is DirNode => n !== null,
  );

  try {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans"));
  } catch {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
  }
  return nodes;
}

export async function GET() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "content", "docs"),
    path.join(cwd, "app", "docs"),
    path.join(cwd, "src", "app", "docs"),
  ];

  const diag: Diag = {
    cwd,
    node: process.version,
    hasFs: hasFs(),
    candidates,
    envHints: {
      NEXT_RUNTIME: process.env.NEXT_RUNTIME ?? null,
      NODE_ENV: process.env.NODE_ENV ?? null,
    },
  };

  try {
    if (!diag.hasFs) {
      return NextResponse.json(
        { ok: false, reason: "fs-unavailable", diag },
        { status: 500 },
      );
    }

    // 异步并行检查所有候选路径是否存在
    const candidateChecks = await Promise.all(
      candidates.map(async (p) => {
        try {
          // 使用 access 检查路径是否可读
          await fs.promises.access(p);
          return { p, exists: true };
        } catch {
          return { p, exists: false };
        }
      }),
    );
    // 从检查结果中找到第一个存在的路径
    const docsRoot = candidateChecks.find((c) => c.exists)?.p;

    if (!docsRoot) {
      return NextResponse.json(
        {
          ok: false,
          reason: "docs-root-not-found",
          diag: {
            ...diag,
            exists: Object.fromEntries(
              candidateChecks.map((c) => [c.p, c.exists]),
            ),
          },
        },
        { status: 500 },
      );
    }

    // try to list
    try {
      const tree = await buildTree(docsRoot, 2);
      return NextResponse.json({ ok: true, docsRoot, tree, diag });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          ok: false,
          reason: "buildTree-failed",
          error: msg,
          diag: { ...diag, docsRoot },
        },
        { status: 500 },
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, reason: "unhandled", error: msg, diag },
      { status: 500 },
    );
  }
}
