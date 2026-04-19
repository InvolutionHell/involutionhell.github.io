import type { ReactNode } from "react";

/**
 * /admin/community/* 子树的 layout。
 *
 * 根 /admin/layout.tsx 已经挂了 Header / Footer，这层仅透传。
 * 保留文件是让 Next 路由分段能命中，必要时在这里插入 community 专属的 Tab / sidebar。
 */
export default function AdminCommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
