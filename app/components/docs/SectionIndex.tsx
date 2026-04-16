import { source } from "@/lib/source";
import { Card, Cards } from "fumadocs-ui/components/card";
import type { PageTree } from "fumadocs-core/server";

/**
 * 通用分区索引（Server Component），替代原本散落的三份各自实现：
 * - `/docs/page.tsx` 的 pageTree.children Cards（PR #290 的 draft）
 * - `app/components/CommunityShareIndex.tsx` 的分组列表（PR #288 的 draft）
 * - `app/docs/CommunityShare/Leetcode/index.mdx` 里的内联 `source.getPages().filter().map(<Card>)`
 *
 * 合并的动机：
 * 1. drift 维护：改一处行为（比如过滤翻译版、排序规则）要改 3 处，容易忘
 * 2. 其中一处还有 404 bug：`/docs/CommunityShare/<没 index 的目录>` 硬拼 URL 在 Next 路由里不存在
 *    —— 和 PR #290 修 `/docs` 404 是同一个根因，即 Next `[...slug]` 不匹配空 slug，folder 没 index.mdx
 *    就意味着 `/docs/X` 没有任何 route
 *
 * 设计思路：
 * - 走 `source.pageTree`（而不是 `getPages()`）：fumadocs 已经把"folder + 其可选 index"的关系
 *   建好了，我们不用自己从扁平 page 列表里反推
 * - `root` 参数接受形如 `"CommunityShare"` / `"CommunityShare/Leetcode"` 的目录相对路径。
 *   undefined 表示从 pageTree 根开始（用于 `/docs` landing）
 * - 渲染策略：统一用 fumadocs `<Cards>` / `<Card>`，三处视觉语言一致
 * - URL 永不硬拼：folder 有 index → 走 index.url；没 index → 递归找子树第一个 page 的 url
 *   作为 fallback（保证不点空）
 * - 翻译版（`lang === "en"` 或文件名 `.en.mdx`）不出现在列表。语言切换仍由 `[...slug]/page.tsx`
 *   的 cookie fallback 处理，这里不重复
 */

type PageNode = Extract<PageTree.Node, { type: "page" }>;
type FolderNode = Extract<PageTree.Node, { type: "folder" }>;

interface SectionIndexProps {
  /** 相对 `/docs` 的目录路径，如 "CommunityShare"；不传则从顶层开始 */
  root?: string;
}

interface CardEntry {
  title: string;
  href: string;
  description?: string;
}

/** 从 pageTree 根出发，按 "a/b/c" 逐段下钻找到目标 folder 节点 */
function findFolderByPath(
  tree: PageTree.Root,
  root: string | undefined,
): PageTree.Root | FolderNode | null {
  if (!root) return tree;
  const segments = root.split("/").filter(Boolean);
  let current: PageTree.Root | FolderNode = tree;
  for (const seg of segments) {
    const children: PageTree.Node[] = current.children;
    const next: FolderNode | undefined = children.find(
      (c): c is FolderNode =>
        c.type === "folder" && folderSegmentName(c) === seg,
    );
    if (!next) return null;
    current = next;
  }
  return current;
}

/**
 * fumadocs 的 FolderNode.name 是 ReactNode（可能是字符串，也可能是 JSX），
 * 单靠 name 匹配不稳定。这里优先用 index 页的 slug 倒数第二段反推目录名，
 * 没 index 时退回 name.toString()。
 */
function folderSegmentName(folder: FolderNode): string {
  // folder.index.url 长这样："/docs/CommunityShare/Geek" → 末段 "Geek" 即目录名
  if (folder.index) {
    const parts = folder.index.url.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }
  // 没 index：从 name 兜底（通常是 string）
  return typeof folder.name === "string" ? folder.name : String(folder.name);
}

/** 判定页面是英文翻译版（不应出现在索引里） */
function isEnglishVariant(page: PageNode): boolean {
  // PageTree 节点 name 可能是 string | ReactNode；英文变体的 frontmatter.lang === "en"
  // 但 pageTree 级别看不到 frontmatter，只能靠 URL 末段后缀兜底
  const urlSlug = page.url.split("/").pop() ?? "";
  return urlSlug.endsWith(".en");
}

/** 深度优先找出子树第一个 page 的 url（folder 没 index 时用来兜底，保证不点空） */
function findFirstPageUrl(nodes: PageTree.Node[]): string | null {
  for (const node of nodes) {
    if (node.type === "separator") continue;
    if (node.type === "page") {
      if (isEnglishVariant(node as PageNode)) continue;
      return (node as PageNode).url;
    }
    if (node.type === "folder") {
      const folder = node as FolderNode;
      if (folder.index && !isEnglishVariant(folder.index)) {
        return folder.index.url;
      }
      const nested = findFirstPageUrl(folder.children);
      if (nested) return nested;
    }
  }
  return null;
}

function nodeToCard(node: PageTree.Node): CardEntry | null {
  if (node.type === "separator") return null;
  if (node.type === "page") {
    const page = node as PageNode;
    if (isEnglishVariant(page)) return null;
    return {
      title: asPlainText(page.name),
      href: page.url,
      description: page.description ? asPlainText(page.description) : undefined,
    };
  }
  // folder
  const folder = node as FolderNode;
  const idxUrl = folder.index?.url;
  const fallbackUrl = idxUrl ?? findFirstPageUrl(folder.children);
  if (!fallbackUrl) return null; // 整个子树都没可链接的 page，跳过（不生成死链）
  return {
    title: folder.index
      ? asPlainText(folder.index.name)
      : asPlainText(folder.name),
    href: fallbackUrl,
    description: folder.index?.description
      ? asPlainText(folder.index.description)
      : undefined,
  };
}

function asPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function SectionIndex({ root }: SectionIndexProps) {
  const node = findFolderByPath(source.pageTree, root);
  if (!node) {
    // 路径写错了（比如打错目录名），给个明显的渲染提示而不是静默空页
    return (
      <p className="text-sm text-red-600">
        SectionIndex: root path &quot;{root}&quot; not found in pageTree
      </p>
    );
  }

  // Root node 和 FolderNode 都有 children；Root 没 index 概念（自身就是 /docs）
  const children = "children" in node ? node.children : [];

  // 过滤：排除根自己的 index（避免"点进自己"）
  const rootIndexUrl = "index" in node ? node.index?.url : undefined;
  const cards = children
    .map(nodeToCard)
    .filter((c): c is CardEntry => c !== null && c.href !== rootIndexUrl)
    // 按 title 中文排序，给读者稳定的浏览顺序
    .sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));

  if (cards.length === 0) {
    return (
      <p className="text-sm text-fd-muted-foreground">
        暂无内容，期待你的投稿！
      </p>
    );
  }

  return (
    <Cards>
      {cards.map((c) => (
        <Card
          key={c.href}
          title={c.title}
          href={c.href}
          description={c.description}
        />
      ))}
    </Cards>
  );
}
