import { getLocale } from "next-intl/server";
import { source } from "@/lib/source";
import { Card, Cards } from "fumadocs-ui/components/card";
import type { PageTree } from "fumadocs-core/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * SectionIndex — 文档分区的子节点卡片索引。
 *
 * 这个组件做一件事：给定一个文档目录，把它的直接子节点（子文件夹 + 文件）
 * 渲染成 Cards。
 *
 * 三处使用场景：
 *   1. /docs landing                              SectionIndex 不传参 → 列出顶层分区
 *   2. community 首页                              SectionIndex root=community
 *   3. career/interview-prep/leetcode 首页         SectionIndex root=career/...
 *
 * ----------------------------------------------------------------------------
 * 为什么不直接用 fumadocs 自带的？
 * fumadocs 有 getPageTreePeers() / DocsCategory，但只返回 type=page 的兄弟
 * 节点，文件夹直接过滤掉。场景 1 / 2 的子节点大多是文件夹，内置 API 返回空。
 *
 * ----------------------------------------------------------------------------
 * 关键变化（i18n URL 段化后）：
 *   - source.pageTree 现在是 Record<locale, PageTree.Root>，按 locale 取
 *   - 不再需要手写 isHideableLocaleVariant / buildCanonicalUrlSet 这套
 *     翻译版剪枝 —— fumadocs i18n 已经把 .en / .zh 后缀的 page 自动归类，
 *     单 locale 的 tree 里不会再混进另一种语言
 *   - SectionIndex 通过 getLocale() 自取当前 locale，调用方（包括
 *     content/docs 下各 .mdx 里的内嵌引用）不用传参
 *
 * ----------------------------------------------------------------------------
 * 几条不改的约束：
 *   - URL 永不硬拼：只用 tree 节点自带的 .url，规避 /docs/<没 index 的目录> 死链
 *   - 渲染用 fumadocs Cards / Card，三处保持视觉一致
 */

type PageNode = Extract<PageTree.Node, { type: "page" }>;
type FolderNode = Extract<PageTree.Node, { type: "folder" }>;

interface SectionIndexProps {
  root?: string;
}

interface CardEntry {
  title: string;
  href: string;
  description?: string;
}

/**
 * 从 pageTree 根一路钻到 root 指定的目录节点。
 *
 * 举例：root = career/interview-prep/leetcode
 *   1) 根的 children 里找 segmentName = career 的 folder
 *   2) 再钻 interview-prep / leetcode
 */
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
 * 取 folder 对应的目录名（用来跟 root 参数里的段做匹配）。
 *
 * 不直接用 folder.name 是因为 FolderNode.name 是 ReactNode 类型（可能是
 * JSX）。从 folder.index.url 反推目录段更可靠（/docs/community/dev-tips
 * 的最后一段 dev-tips 就是目录名）。
 */
function folderSegmentName(folder: FolderNode): string {
  if (folder.index) {
    const parts = folder.index.url.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }
  return typeof folder.name === "string" ? folder.name : String(folder.name);
}

/**
 * 深度优先找子树里第一个可链接的 page url。
 *
 * 用途：folder 没有自己的 index.mdx 时，不能硬拼 /docs/<folder> 做卡片
 * 链接（404）。所以往里走，找到第一个 page 文件的 url 兜底。
 */
function findFirstPageUrl(nodes: PageTree.Node[]): string | null {
  for (const node of nodes) {
    if (node.type === "separator") continue;
    if (node.type === "page") return node.url;
    if (node.type === "folder") {
      if (node.index) return node.index.url;
      const nested = findFirstPageUrl(node.children);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * 把一个 pageTree 节点归一成 Card 数据。
 *
 * - separator 跳过
 * - page 直接用 name + url + description
 * - folder：
 *     有 index   → 用 index 的 name / url / description
 *     没 index   → 用 folder.name 做标题，href 兜底到 findFirstPageUrl
 *     整子树空   → null（不生成死链）
 */
function nodeToCard(node: PageTree.Node): CardEntry | null {
  if (node.type === "separator") return null;

  if (node.type === "page") {
    const page = node as PageNode;
    return {
      title: asPlainText(page.name),
      href: page.url,
      description: page.description ? asPlainText(page.description) : undefined,
    };
  }

  const folder = node as FolderNode;
  const fallbackUrl = folder.index?.url ?? findFirstPageUrl(folder.children);
  if (!fallbackUrl) return null;
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

/**
 * PageTree 里 name / description 是 ReactNode 类型，这里强制要 string 做卡片标题。
 * 仓库里所有 frontmatter 都是 string，不会走到 String(value) 兜底。
 */
function asPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export async function SectionIndex({ root }: SectionIndexProps) {
  const locale = await getLocale();
  const lang = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  // 第 1 步：按 locale 取对应的 pageTree（fumadocs i18n 自动按语言隔离）
  const tree = source.pageTree[lang];
  const node = findFolderByPath(tree, root);
  if (!node) {
    return (
      <p className="text-sm text-red-600">
        SectionIndex: root path &quot;{root}&quot; not found in pageTree
      </p>
    );
  }

  // 第 2 步：拿它的直接子节点
  const children = "children" in node ? node.children : [];

  // 第 3 步：转 Card 数据；排除根自己的 index URL（避免 "Geek -> Geek" 自循环）
  const rootIndexUrl = "index" in node ? node.index?.url : undefined;
  const cards = children
    .map((n) => nodeToCard(n))
    .filter((c): c is CardEntry => c !== null && c.href !== rootIndexUrl)
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
