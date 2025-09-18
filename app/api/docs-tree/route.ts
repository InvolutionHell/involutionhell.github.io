import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function safeListDir(dir: string): { entries: fs.Dirent[]; error?: string } {
  try {
    return { entries: fs.readdirSync(dir, { withFileTypes: true }) };
  } catch (e) {
    return { entries: [], error: String(e) };
  }
}

function buildTree(root: string, maxDepth = 2, rel = ""): DirNode[] {
  const { entries, error } = safeListDir(root);
  if (error) throw new Error(`readdir failed at ${root}: ${error}`);

  const dirs = entries.filter((d) => d.isDirectory());
  const nodes: DirNode[] = [];

  for (const e of dirs) {
    if (e.name.startsWith(".") || e.name.startsWith("[")) continue;
    const abs = path.join(root, e.name);
    const nodeRel = rel ? `${rel}/${e.name}` : e.name;

    let node: DirNode;
    if (e.name !== "CommunityShare") {
      node = { name: e.name, path: nodeRel };
    } else {
      node = { name: "群友分享", path: nodeRel };
    }
    if (maxDepth > 1) node.children = buildTree(abs, maxDepth - 1, nodeRel);
    nodes.push(node);
  }

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

    // pick the first existing candidate
    const docsRoot = candidates.find((p) => fs.existsSync(p));
    if (!docsRoot) {
      return NextResponse.json(
        {
          ok: false,
          reason: "docs-root-not-found",
          diag: {
            ...diag,
            exists: Object.fromEntries(
              candidates.map((p) => [p, fs.existsSync(p)]),
            ),
          },
        },
        { status: 500 },
      );
    }

    // try to list
    let tree: DirNode[] = [];
    try {
      tree = buildTree(docsRoot, 2);
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

    return NextResponse.json({ ok: true, docsRoot, tree, diag });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, reason: "unhandled", error: msg, diag },
      { status: 500 },
    );
  }
}
