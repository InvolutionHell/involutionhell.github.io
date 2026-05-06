"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { EditorPageClient } from "./EditorPageClient";

/**
 * 编辑器页面 - 客户端组件
 * token 存在 localStorage，无法在服务端读取，因此改用客户端鉴权
 */
export default function EditorPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 状态确认后，未登录则跳转到登录页
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/editor");
    }
  }, [status, router]);

  // 加载中显示骨架占位
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  // 未登录时先不渲染内容（useEffect 会触发跳转）
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <EditorPageClient user={user} />
    </div>
  );
}
