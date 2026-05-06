import type { ReactNode } from "react";

/**
 * /admin/events/* 子树的 layout。
 *
 * 之前这里单独挂 Header / Footer 是因为当时还没有 /admin/layout.tsx。现在根 admin
 * 已经有共享 layout，这层只是透传，保留文件是为了 Next 路由分段还能命中。
 */
export default function AdminEventsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
