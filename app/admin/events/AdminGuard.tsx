"use client";

/**
 * 前端管理员页的权限包装器。
 *
 * 行为：
 * - 未登录：跳 /login
 * - 登录但不满足 required 角色：渲染 403 提示
 * - 通过：渲染 children
 *
 * required 取值：
 *   "admin"      → roles 包含 admin（superadmin 也通过，因为他们 roles 里也会带 admin）
 *   "superadmin" → roles 必须包含 superadmin
 *
 * 这个只是 UX 层保护——真正的安全由后端 @SaCheckRole(...) 兜底，绕过 UI
 * 也拿不到数据。
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 默认 "admin"（事件管理等通用后台页）；用户管理页传 "superadmin" */
  required?: "admin" | "superadmin";
}

export function AdminGuard({ children, required = "admin" }: Props) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      // 注意：登录页 / SignInButton 当前没实现 next 参数透传（走 GitHub OAuth
      // 走 /oauth/render/github，回调后固定落在首页 #token=xxx）。这里就不带
      // ?next=，避免"看起来支持其实不生效"的迷惑。登录成功后用户需自己再点
      // 个人主页里的"管理员界面"按钮返回这里。
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
          Loading…
        </p>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  const roles = user?.roles ?? [];
  const passes = roles.includes("superadmin") || roles.includes(required); // superadmin 在 seed 里也会带 admin，所以这里一起通过
  if (!passes) {
    return (
      <main className="pt-32 pb-16 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg border border-[#CC0000] p-8 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#CC0000] mb-3">
            403 · Forbidden
          </div>
          <h1 className="font-serif text-2xl font-black mb-3">
            {required === "superadmin" ? "需要超级管理员权限" : "你不是管理员"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {required === "superadmin"
              ? "此页面仅对 superadmin 开放。如果你认为这是误报，联系站点维护者。"
              : "管理员界面仅对 roles 包含 admin 的账号开放。如果你认为这是误报，联系站点维护者。"}
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
