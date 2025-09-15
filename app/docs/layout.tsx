import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { ReactNode } from "react";
import { DocsRouteFlag } from "@/app/components/RouteFlags";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Add a class on <html> while in docs to adjust global backgrounds */}
      <DocsRouteFlag />
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions()}
        sidebar={{
          // 第一屏仅显示目录，不展开子目录
          defaultOpenLevel: 0,
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
