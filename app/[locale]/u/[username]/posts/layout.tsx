import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

/**
 * /u/[username]/posts 的 Server Component layout。
 * posts/page.tsx 是 client 组件（useAuth 判定本人身份），
 * Header / Footer 提到这一层避免 client 组件里渲染 async Server Component。
 */
export default function PostsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
