import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";
import { DocsRouteFlag } from "@/app/components/RouteFlags";
import type { PageTree } from "fumadocs-core/server";

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
          onlyChild.url.startsWith("/docs/ai/")
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

export default function Layout({ children }: { children: ReactNode }) {
  const tree = pruneEmptyFolders(source.pageTree);

  return (
    <>
      {/* Add a class on <html> while in docs to adjust global backgrounds */}
      <DocsRouteFlag />
      <DocsLayout
        tree={tree}
        {...baseOptions()}
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
