import { source } from "@/lib/source";
import { Card, Cards } from "fumadocs-ui/components/card";
import type { PageTree } from "fumadocs-core/server";

/**
 * ============================================================================
 * <SectionIndex> — 文档分区的"子节点卡片索引"
 * ============================================================================
 *
 * 这个组件做一件事：**给定一个文档目录，把它的直接子节点（子文件夹 + 文件）渲染成 Cards**。
 *
 * 三处使用场景：
 *   1. /docs landing        → <SectionIndex />                          列出顶层分区（ai / cs / 群友分享 ...）
 *   2. CommunityShare 首页   → <SectionIndex root="CommunityShare" />    列出 Geek / Leetcode / RAG 等子分类
 *   3. Leetcode 首页         → <SectionIndex root="CommunityShare/Leetcode" />  列出 49 篇题解
 *
 * ----------------------------------------------------------------------------
 * 为什么不直接用 fumadocs 自带的？
 *   fumadocs 确实有 getPageTreePeers() 和 <DocsCategory>（deprecated 但能用），
 *   但它们**只返回 type="page" 的兄弟节点，文件夹直接过滤掉**。
 *   → 场景 1 和 2 的子节点大多是文件夹，内置 API 在这俩场景下返回空。
 *   → 场景 3（Leetcode 下面全是 page）倒是可以直接用 <DocsCategory>。
 *   为了三处共用一个视觉，这里自己走一遍 pageTree。
 *
 * ----------------------------------------------------------------------------
 * source.pageTree 长什么样（心智模型）
 *
 *   Root {
 *     children: [
 *       Folder {
 *         name: "AI 知识库",
 *         index: Page { url: "/docs/ai",  name: "AI 知识库" },   // 有 index.mdx
 *         children: [ Page, Folder, ... ]
 *       },
 *       Folder {
 *         name: "All projects",
 *         index: undefined,                                      // 没 index.mdx
 *         children: [ ... ]
 *       },
 *       ...
 *     ]
 *   }
 *
 *   关键：Folder 可能**没有** index（对应目录下没 index.mdx），这种情况下：
 *   - fumadocs 不会给它生成 /docs/<folder> 路由 → 硬拼这个 URL 会 404
 *   - 所以要 fallback 到子树第一个 page 的 url（见 findFirstPageUrl）
 *
 * ----------------------------------------------------------------------------
 * 几条不改的约束：
 *   - URL 永不硬拼：只用 tree 节点自带的 .url，规避 "/docs/<没 index 的目录>" 死链
 *   - 英文翻译版（URL 末段 .en）过滤掉，由 [...slug] 的 cookie locale fallback 负责切语言
 *   - 渲染用 fumadocs <Cards>/<Card>，三处保持视觉一致
 * ============================================================================
 */

// fumadocs PageTree 节点是 discriminated union，先抽出两个具体类型方便写类型注解
type PageNode = Extract<PageTree.Node, { type: "page" }>;
type FolderNode = Extract<PageTree.Node, { type: "folder" }>;

interface SectionIndexProps {
  /**
   * 从 pageTree 根往下走的目录路径，段之间用 "/"，例如 "CommunityShare/Leetcode"。
   * 不传 = 直接用 pageTree 根节点本身（用于 /docs landing）。
   */
  root?: string;
}

// 一张 Card 需要的最小数据。渲染前把各种节点（page / folder）归一成这个结构
interface CardEntry {
  title: string;
  href: string;
  description?: string;
}

/**
 * 从 pageTree 根一路"钻"到 root 指定的目录节点。
 *
 * 举例：root = "CommunityShare/Leetcode"
 *   ① 根的 children 里找 segmentName === "CommunityShare" 的 folder
 *   ② 再在这个 folder 的 children 里找 segmentName === "Leetcode" 的 folder
 *   ③ 返回这个 folder 节点
 *
 * 任一段找不到就返回 null（组件会渲染一个明显的错误提示，而不是静默空页）。
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
 * 取 folder 对应的"目录名"（用来跟 root 参数里的段做匹配）。
 *
 * 为什么不直接用 `folder.name`？
 * fumadocs 的 FolderNode.name 是 **ReactNode**（string | 复杂 JSX 都可能），
 * 直接字符串比较会在极端情况踩坑。更可靠的办法是从 folder.index.url 反推——
 * 比如 "/docs/CommunityShare/Geek" 末段 "Geek" 就是目录名。
 *
 * 没 index 时只能退回 name.toString()。目前仓库里这种情况目录名都是纯字符串，
 * 所以兜底够用。
 */
function folderSegmentName(folder: FolderNode): string {
  if (folder.index) {
    const parts = folder.index.url.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }
  return typeof folder.name === "string" ? folder.name : String(folder.name);
}

/**
 * 这个 page 是不是英文翻译版？是的话不进索引列表。
 *
 * 站点里有两种翻译版文件：
 *   - 早期：`xxx.en.mdx`（靠 frontmatter.lang === "en" 标记）
 *   - 新：  `xxx.en.md` 带 translatedFrom frontmatter
 * PageTree 节点层面看不到 frontmatter，只能靠 URL 末段后缀 `.en` 兜底识别。
 * 不影响展示正确性——翻译切换由 [...slug]/page.tsx 的 cookie locale fallback 做。
 */
function isEnglishVariant(page: PageNode): boolean {
  const urlSlug = page.url.split("/").pop() ?? "";
  return urlSlug.endsWith(".en");
}

/**
 * 深度优先找子树里第一个可链接的 page url。
 *
 * 用途：folder 没有自己的 index.mdx 时，不能硬拼 /docs/<folder> 做卡片链接
 * （Next 路由里没这条，会 404）。所以往里走一层，找到第一个 page 文件的 url
 * 拿来做兜底链接。比如：
 *
 *   CommunityShare/Language/     ← 没 index.mdx
 *     pte-intro.mdx               ← 用这篇的 url 做兜底
 *
 * 点击卡片会进到 /docs/CommunityShare/Language/pte-intro，不会 404。
 */
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

/**
 * 把一个 pageTree 节点归一成 Card 数据。
 *
 * - separator 节点（sidebar 分隔条）→ 跳过
 * - page 节点 → 直接用 name + url + description
 * - folder 节点 →
 *     · 有 index：用 index 的 name / url / description（最直观的形态）
 *     · 没 index：用 folder.name 做标题，href 兜底到 findFirstPageUrl
 *     · 整个子树连一个可链接的 page 都没有：返回 null 跳过（不生成死链）
 * - 英文翻译版 → 返回 null 跳过
 */
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

  const folder = node as FolderNode;
  const idxUrl = folder.index?.url;
  const fallbackUrl = idxUrl ?? findFirstPageUrl(folder.children);
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
 * PageTree 里 name/description 类型是 ReactNode，这里强行要一个 string 做卡片标题。
 * 实际上仓库里所有 frontmatter 都是 string，不会走到 String(value) 的分支。
 */
function asPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function SectionIndex({ root }: SectionIndexProps) {
  // 第 1 步：定位目标节点（pageTree 根 or 某个 folder）
  const node = findFolderByPath(source.pageTree, root);
  if (!node) {
    return (
      <p className="text-sm text-red-600">
        SectionIndex: root path &quot;{root}&quot; not found in pageTree
      </p>
    );
  }

  // 第 2 步：拿它的直接子节点。PageTree.Root 和 FolderNode 都有 children 字段，
  // 但类型定义上 Root 没有 index 字段，所以下面要区分一下。
  const children = "children" in node ? node.children : [];

  // 第 3 步：过滤 + 转成 Card 数据。
  // - 排除根自己的 index URL（folder 的 index 会和 folder 本身同 url，
  //   不过滤的话"点进自己"会导致"Geek → Geek"这种死循环展示）
  // - 按 title 中文排序，保证每次渲染顺序稳定（不然 file system order 会跟 OS 走）
  const rootIndexUrl = "index" in node ? node.index?.url : undefined;
  const cards = children
    .map(nodeToCard)
    .filter((c): c is CardEntry => c !== null && c.href !== rootIndexUrl)
    .sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));

  if (cards.length === 0) {
    return (
      <p className="text-sm text-fd-muted-foreground">
        暂无内容，期待你的投稿！
      </p>
    );
  }

  // 第 4 步：fumadocs 的 Cards / Card 组件负责视觉
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
