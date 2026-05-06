"use client";

/**
 * /admin/users — 超管用户管理。
 *
 * 权限：AdminGuard required="superadmin"。
 * 功能：
 *   - 搜索框（按 username / displayName / email 模糊匹配，前端和后端都做）
 *   - 列表每行一个 checkbox 切换 admin 角色，乐观更新 + 失败回滚
 *   - superadmin 行禁用 checkbox（产品规则：不通过 API 降级 superadmin）
 *   - 自己的行禁用 checkbox（防止唯一超管把自己摘 admin 锁死）
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { AdminGuard } from "../events/AdminGuard";
import { listAdminUsers, setUserAdminRole, type AdminUserView } from "./lib";

export default function AdminUsersPage() {
  return (
    <AdminGuard required="superadmin">
      <AdminUsersInner />
    </AdminGuard>
  );
}

function AdminUsersInner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAdminUsers();
      setUsers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // 前端再做一遍模糊过滤，减少输入即时反馈的 API 调用频率
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) =>
      [u.username, u.displayName, u.email]
        .filter((v): v is string => typeof v === "string")
        .some((s) => s.toLowerCase().includes(kw)),
    );
  }, [users, keyword]);

  const onToggle = async (u: AdminUserView, nextAdmin: boolean) => {
    setTogglingId(u.id);
    // 乐观更新
    const prev = users;
    setUsers((xs) =>
      xs.map((x) =>
        x.id === u.id
          ? {
              ...x,
              roles: nextAdmin
                ? Array.from(new Set([...x.roles, "admin", "user"]))
                : x.roles.filter((r) => r !== "admin"),
            }
          : x,
      ),
    );
    try {
      const updated = await setUserAdminRole(u.id, nextAdmin);
      setUsers((xs) => xs.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      setUsers(prev);
      alert(e instanceof Error ? e.message : "操作失败");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <Link
          href="/admin"
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000] transition-colors"
        >
          ← 返回管理员首页
        </Link>

        <header className="mt-4 border-t-4 border-[var(--foreground)] pt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Superadmin · Users
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
              用户管理
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              勾选 admin 即赋予管理员角色；取消即撤销。superadmin
              角色不允许在这里改， 只能走 DB。
            </p>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <label
              htmlFor="user-search"
              className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
            >
              搜索
            </label>
            <input
              id="user-search"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="username / displayName / email"
              className="border border-[var(--foreground)] px-3 py-2 bg-[var(--background)] text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[#CC0000]"
            />
          </div>
        </header>

        {loading && (
          <p className="font-mono text-xs text-neutral-500">加载中…</p>
        )}
        {error && (
          <div className="border border-[#CC0000] p-4 text-sm text-[#CC0000] font-mono mb-6">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div className="border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-sans text-sm">
            没有匹配的用户。
          </div>
        )}

        {filtered.length > 0 && (
          <table className="w-full border-collapse border border-[var(--foreground)] text-sm">
            <thead>
              <tr className="border-b border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900">
                <Th>#</Th>
                <Th>用户</Th>
                <Th>Email</Th>
                <Th>Roles</Th>
                <Th className="text-center">Admin</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isAdmin = u.roles.includes("admin");
                const isSuper = u.roles.includes("superadmin");
                const isSelf = me != null && u.id === me.id;
                // 禁用规则：superadmin 永不允许改；自己也不能给自己去 admin
                const disabled =
                  togglingId === u.id || isSuper || (isSelf && isAdmin);
                return (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--foreground)]/40 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  >
                    <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                      {u.id}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            className="w-7 h-7 border border-[var(--foreground)] object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-serif text-sm font-semibold">
                            {u.displayName || u.username}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500">
                            @{u.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5 ${
                              r === "superadmin"
                                ? "border-[#CC0000] text-[#CC0000]"
                                : r === "admin"
                                  ? "border-[var(--foreground)]"
                                  : "border-neutral-400 text-neutral-500"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAdmin}
                        disabled={disabled}
                        onChange={(e) => onToggle(u, e.target.checked)}
                        aria-label={`toggle admin for ${u.username}`}
                        className="w-4 h-4 accent-[#CC0000] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          isSuper
                            ? "superadmin 角色不允许通过 API 修改"
                            : isSelf && isAdmin
                              ? "不能给自己撤销 admin"
                              : undefined
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${className ?? ""}`}
    >
      {children}
    </th>
  );
}
