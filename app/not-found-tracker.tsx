"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 从 not-found.tsx 拆出来的 umami 404 埋点。
// 拆分原因：not-found.tsx 必须保持 Server Component（见同目录 not-found.tsx 注释），
// useEffect / usePathname / window.umami 只能在 client。
export default function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.umami) {
      window.umami.track("error_404", {
        path: pathname,
        referrer: document.referrer || "direct",
      });
    }
  }, [pathname]);

  return null;
}
