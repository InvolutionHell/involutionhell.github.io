import type { ReactNode } from "react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

/**
 * /feed/submit 的 Server Component layout。
 *
 * 把 Header / Footer（依赖 next-intl/server.getTranslations 的 async Server Component）
 * 放在这一层，让子 page 可以保持 "use client"，不再触发
 * "async Client Component is not supported" 报错。
 */
export default function SubmitLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
