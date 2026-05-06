import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";
import { DocsRouteFlag } from "@/app/components/RouteFlags";
import type { PageTree } from "fumadocs-core/server";
import { CopyTracking } from "@/app/components/CopyTracking";
import { DocsPageViewTracker } from "@/app/components/DocsPageViewTracker";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * 单 child 文件夹的 hoist 规则。
 *
 * 历史背景：learn/ai/ 下有些 folder 只挂了一篇文章（例如某个细分主题只
 * 写了一篇），sidebar 里展开折叠没意义。把这种 folder 替换成它的唯一
 * child page，让 sidebar 更紧凑。
 *
 * 限定 learn/ai/ 是因为这是社区里最多"独苗 folder"的子树，其它分区不
 * 强行 hoist 避免误压平正常的层级结构。
 */
function pruneEmptyFolders(root: PageTree.Root): PageTree.Root {
  const transformNode = (node: PageTree.Node): PageTree.Node | null => {
    if (node.type === "folder") {
      const transformedChildren = node.children
        .map(transformNode)
        .filter((child): child is PageTree.Node => child !== null);

      const index = node.index ? { ...node.index } : undefined;

      if (transformedChildren.length === 0) {
        if (index) return { ...index };
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

      return { ...node, index, children: transformedChildren };
    }
    if (node.type === "separator") return { ...node };
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

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Docs 子树共享 layout。
 *
 * 关键变化（i18n URL 段化）：
 *   旧版手写 pickVariantsByLocale / filterTreeByLocale，按 cookie 把
 *   pageTree 里的 .en / .zh 变体筛成单语 tree。fumadocs i18n 接入后
 *   `source.getPageTree(locale)` 已经原生返回单 locale 的 tree，整段
 *   过滤逻辑直接删除，只保留 learn/ai/ 单 child folder 的 hoist 规则。
 */
export default async function Layout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const tree = pruneEmptyFolders(source.getPageTree(locale));
  const options = await baseOptions();
  return (
    <>
      <CopyTracking />
      <DocsPageViewTracker />
      <DocsRouteFlag />
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
