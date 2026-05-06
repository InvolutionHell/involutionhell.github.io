import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

/**
 * /admin/* 的共享 layout。
 *
 * 和 app/admin/events/layout.tsx 同样的问题：Header / Footer 是 Server Component
 * （用 next-intl/server.getTranslations），不能嵌在 "use client" 的页面里，否则
 * 报 "getTranslations is not supported in Client Components" 500。
 * 提到这一层 Server Component layout，让各个 admin 页面本身保持 client 组件。
 *
 * 注意：之前 app/admin/events/layout.tsx 是为 events 子树单独做的。现在引入
 * /admin 根 layout 之后，二者嵌套 Header / Footer 会重复。events 那层 layout
 * 相应精简为空透传（见该文件）。
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
