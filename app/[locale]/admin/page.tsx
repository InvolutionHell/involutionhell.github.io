"use client";

/**
 * /admin — 管理员后台首页。
 *
 * 根据登录用户的 role 决定卡片显隐：
 *   admin       → 看到"活动管理"
 *   superadmin  → 额外看到"用户管理"
 *
 * 权限由 <AdminGuard required="admin"> 统一把守——superadmin 必然有 admin 角色，
 * 所以不会被挡；非 admin 直接 403。
 */

import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { AdminGuard } from "./events/AdminGuard";

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHomeInner />
    </AdminGuard>
  );
}

function AdminHomeInner() {
  const { user } = useAuth();
  const isSuperadmin = user?.roles?.includes("superadmin") ?? false;

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Admin · Home
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
            管理员后台
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            选择要管理的模块。真正的权限控制在后端，前端按钮只是入口。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminCard
            title="活动管理"
            description="创建、编辑、归档社群活动（Coffee Chat / Mock / Career Journey 等）。"
            href="/admin/events"
            badge="Admin+"
          />
          <AdminCard
            title="数据库管理"
            description="嵌入 pgAdmin，用按钮完成备份 / 恢复 / 查表 / 跑 SQL。"
            href="/admin/database"
            badge="Admin+"
          />
          {isSuperadmin && (
            <AdminCard
              title="用户管理"
              description="给其他登录用户授予 / 撤销 admin 角色。"
              href="/admin/users"
              badge="Superadmin only"
              accent
            />
          )}
        </div>
      </div>
    </main>
  );
}

function AdminCard({
  title,
  description,
  href,
  badge,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block border p-6 transition-colors group ${
        accent
          ? "border-[#CC0000] hover:bg-[#CC0000] hover:text-white"
          : "border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      }`}
    >
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.3em] mb-2 ${
          accent
            ? "text-[#CC0000] group-hover:text-white"
            : "text-neutral-500 group-hover:text-[var(--background)]"
        }`}
      >
        {badge}
      </div>
      <h2 className="font-serif text-xl font-black uppercase tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-sm leading-relaxed opacity-80">{description}</p>
    </Link>
  );
}
