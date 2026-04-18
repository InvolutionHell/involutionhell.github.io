import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";
import { DocsRouteFlag } from "@/app/components/RouteFlags";
import type { PageTree } from "fumadocs-core/server";
import { CopyTracking } from "@/app/components/CopyTracking";
import { DocsPageViewTracker } from "@/app/components/DocsPageViewTracker";
import { cookies } from "next/headers";

type Locale = "zh" | "en";
type SourcePage = ReturnType<typeof source.getPages>[number];

/**
 * 从 slug 数组末尾剥离语言后缀（.en / .zh），返回 canonical slug + 识别出的后缀。
 *
 * 例：["ai", "rl.en"] → { canonical: ["ai", "rl"], suffix: "en" }
 *    ["ai", "rl"]    → { canonical: ["ai", "rl"], suffix: null }
 */
function stripLocaleSuffix(slugs: readonly string[]): {
  canonical: string[];
  suffix: Locale | null;
} {
  const last = slugs[slugs.length - 1] ?? "";
  const m = /^(.+)\.(en|zh)$/.exec(last);
  if (m) {
    return {
      canonical: [...slugs.slice(0, -1), m[1]],
      suffix: m[2] as Locale,
    };
  }
  return { canonical: [...slugs], suffix: null };
}

function slugsToUrl(slugs: string[]): string {
  return slugs.length === 0 ? "/docs" : `/docs/${slugs.join("/")}`;
}

/**
 * 把所有 page 按 canonical URL 分组，每组按优先级挑一个最适合当前 locale 的变体：
 *   1. 显式 .{locale}.mdx（例 foo.en.mdx 匹配 locale=en）
 *   2. frontmatter.lang 与 locale 相同的原文（没后缀但 lang 字段对得上）
 *   3. 无 locale 标记的原文（兜底，保证每组至少保留一个）
 *
 * 返回 rawUrl（page 原始 URL，含 .en/.zh 后缀）→ canonicalUrl 的映射。
 * 只有被选中的变体会出现在 Map 里；其它变体在 sidebar 里要被剪掉。
 */
function pickVariantsByLocale(
  pages: SourcePage[],
  locale: Locale,
): Map<string, string> {
  const groups = new Map<string, SourcePage[]>();
  for (const p of pages) {
    const { canonical } = stripLocaleSuffix(p.slugs);
    const key = slugsToUrl(canonical);
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }

  const result = new Map<string, string>();
  for (const [canonicalUrl, variants] of groups) {
    const chosen = chooseVariant(variants, locale);
    result.set(chosen.url, canonicalUrl);
  }
  return result;
}

function chooseVariant(variants: SourcePage[], locale: Locale): SourcePage {
  // 1. 显式 .{locale} 后缀的翻译版
  const explicit = variants.find(
    (p) => stripLocaleSuffix(p.slugs).suffix === locale,
  );
  if (explicit) return explicit;

  // 2. 原文（无后缀）且 frontmatter.lang === locale
  const originalMatching = variants.find((p) => {
    const { suffix } = stripLocaleSuffix(p.slugs);
    if (suffix !== null) return false;
    const lang = (p.data as { lang?: string }).lang;
    return lang === locale;
  });
  if (originalMatching) return originalMatching;

  // 3. 原文兜底（显示原语言，避免某篇文档因为没翻译就从 sidebar 消失）
  const original = variants.find(
    (p) => stripLocaleSuffix(p.slugs).suffix === null,
  );
  if (original) return original;

  // 4. 实在没原文（理论上不会到这，除非两个 .en/.zh 并存没原文），随便返回一个
  return variants[0];
}

/**
 * 按选中的变体集合剪 PageTree：
 *   - 页节点：URL 不在 chosen 里 → 删除；在 chosen 里 → 改写 url 成 canonical
 *   - 文件夹：递归处理子节点，子节点全空就连同文件夹一起删
 *   - index 页同样判定 + 改写
 */
function filterTreeByLocale(
  root: PageTree.Root,
  chosen: Map<string, string>,
): PageTree.Root {
  const transformIndex = (
    index: PageTree.Folder["index"],
  ): PageTree.Folder["index"] => {
    if (!index) return undefined;
    const canonicalUrl = chosen.get(index.url);
    if (canonicalUrl === undefined) return undefined;
    return { ...index, url: canonicalUrl };
  };

  const transformNode = (node: PageTree.Node): PageTree.Node | null => {
    if (node.type === "folder") {
      const children = node.children
        .map(transformNode)
        .filter((c): c is PageTree.Node => c !== null);
      const index = transformIndex(node.index);
      if (!index && children.length === 0) return null;
      return { ...node, index, children };
    }
    if (node.type === "separator") return { ...node };
    // page
    const canonicalUrl = chosen.get(node.url);
    if (canonicalUrl === undefined) return null;
    return { ...node, url: canonicalUrl };
  };

  const transformRoot = (r: PageTree.Root): PageTree.Root => {
    const children = r.children
      .map(transformNode)
      .filter((c): c is PageTree.Node => c !== null);
    return {
      ...r,
      children,
      fallback: r.fallback ? transformRoot(r.fallback) : undefined,
    };
  };

  return transformRoot(root);
}

function pruneEmptyFolders(root: PageTree.Root): PageTree.Root {
  const transformNode = (node: PageTree.Node): PageTree.Node | null => {
    if (node.type === "folder") {
      const transformedChildren = node.children
        .map(transformNode)
        .filter((child): child is PageTree.Node => child !== null);

      const index = node.index ? { ...node.index } : undefined;

      if (transformedChildren.length === 0) {
        if (index) {
          return { ...index };
        }

        return null;
      }

      if (!index && transformedChildren.length === 1) {
        const [onlyChild] = transformedChildren;

        if (
          onlyChild.type === "page" &&
          onlyChild.url.startsWith("/docs/learn/ai/")
        ) {
          return { ...onlyChild };
        }
      }

      return {
        ...node,
        index,
        children: transformedChildren,
      };
    }

    if (node.type === "separator") {
      return { ...node };
    }

    return { ...node };
  };

  const transformRoot = (node: PageTree.Root): PageTree.Root => {
    const children = node.children
      .map(transformNode)
      .filter((child): child is PageTree.Node => child !== null);

    return {
      ...node,
      children,
      fallback: node.fallback ? transformRoot(node.fallback) : undefined,
    };
  };

  return transformRoot(root);
}

export default async function Layout({ children }: { children: ReactNode }) {
  // 根据 locale cookie 为 sidebar 挑选文档变体；与根 layout.tsx 的 locale 读取方式保持一致
  const cookieStore = await cookies();
  const locale: Locale =
    cookieStore.get("locale")?.value === "en" ? "en" : "zh";

  // 先按 locale 筛掉重复的翻译变体，剩下每组只留一个；再剪空文件夹
  const chosen = pickVariantsByLocale(source.getPages(), locale);
  const localizedTree = filterTreeByLocale(source.pageTree, chosen);
  const tree = pruneEmptyFolders(localizedTree);
  const options = await baseOptions();
  return (
    <>
      {/* Add a class on <html> while in docs to adjust global backgrounds */}
      <CopyTracking />
      <DocsPageViewTracker />
      <DocsRouteFlag />
      <DocsPageViewTracker />
      <DocsLayout
        tree={tree}
        {...options}
        sidebar={{
          // Only show top-level items on first load
          defaultOpenLevel: 0,
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
