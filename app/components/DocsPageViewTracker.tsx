"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function DocsPageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const key = `pv_reported:${pathname}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("satoken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["x-satoken"] = token;

    fetch("/api/analytics", {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType: "page_view",
        eventData: { path: pathname, title: document.title },
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
