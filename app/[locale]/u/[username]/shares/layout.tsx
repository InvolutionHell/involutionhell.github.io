import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

/**
 * /u/[username]/shares 的 Server Component layout。
 *
 * shares/page.tsx 是 client 组件（依赖 useAuth 判定本人身份），
 * 不能直接渲染 async Server Component Header / Footer；提到这一层 Server Layout。
 */
export default function SharesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
