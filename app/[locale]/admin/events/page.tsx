"use client";

/**
 * /admin/events — 管理员后台活动列表。
 *
 * 权限：包在 <AdminGuard> 里，非 admin 看不到数据。
 * 交互：列表 + 状态标记 + 编辑/删除按钮；顶上一个"新建活动"。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventView } from "@/app/[locale]/events/types";
import { AdminGuard } from "./AdminGuard";
import { deleteEvent, listAdminEvents } from "./lib";

// Header / Footer 由 admin/events/layout.tsx（Server Component）负责渲染
export default function AdminEventsPage() {
  return (
    <AdminGuard>
      <AdminEventsInner />
    </AdminGuard>
  );
}

function AdminEventsInner() {
  const [events, setEvents] = useState<EventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAdminEvents();
      setEvents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onDelete = async (id: number, title: string) => {
    if (
      !confirm(
        `确定删除「${title}」？此操作不可逆，会连同所有感兴趣记录一起清空。`,
      )
    ) {
      return;
    }
    setDeleting(id);
    try {
      await deleteEvent(id);
      setEvents((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Admin · Events
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
              活动管理
            </h1>
          </div>
          <Link
            href="/admin/events/new"
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors"
          >
            + 新建活动
          </Link>
        </header>

        {loading && (
          <p className="font-mono text-xs text-neutral-500">加载中…</p>
        )}
        {error && (
          <div className="border border-[#CC0000] p-4 text-sm text-[#CC0000] font-mono mb-6">
            {error}
          </div>
        )}

        {!loading && events.length === 0 && !error && (
          <div className="border border-dashed border-[var(--foreground)] p-10 text-center text-neutral-500 font-sans text-sm">
            还没有活动。点右上角新建。
          </div>
        )}

        {events.length > 0 && (
          <table className="w-full border-collapse border border-[var(--foreground)] text-sm">
            <thead>
              <tr className="border-b border-[var(--foreground)] bg-neutral-100 dark:bg-neutral-900">
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  #
                </th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  标题
                </th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  状态
                </th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  开始时间
                </th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  感兴趣
                </th>
                <th className="text-right px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--foreground)]/40 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                >
                  <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                    {e.id}
                  </td>
                  <td className="px-3 py-3 font-serif font-semibold">
                    <Link
                      href={`/admin/events/${e.id}/edit`}
                      className="hover:text-[#CC0000] transition-colors"
                    >
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs uppercase">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                    {e.startTime
                      ? new Date(e.startTime).toLocaleString("zh-CN")
                      : "—"}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {e.interestCount}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/events/${e.id}`}
                        target="_blank"
                        className="font-mono text-[10px] uppercase tracking-widest border border-[var(--foreground)] px-2 py-1 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                      >
                        预览
                      </Link>
                      <Link
                        href={`/admin/events/${e.id}/edit`}
                        className="font-mono text-[10px] uppercase tracking-widest border border-[var(--foreground)] px-2 py-1 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                      >
                        编辑
                      </Link>
                      <button
                        type="button"
                        disabled={deleting === e.id}
                        onClick={() => onDelete(e.id, e.title)}
                        className="font-mono text-[10px] uppercase tracking-widest border border-[#CC0000] text-[#CC0000] px-2 py-1 hover:bg-[#CC0000] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {deleting === e.id ? "删除中…" : "删除"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    draft: "border-neutral-400 text-neutral-500",
    published: "border-[#CC0000] text-[#CC0000]",
    archived: "border-neutral-600 text-neutral-600",
    cancelled: "border-neutral-400 text-neutral-400 line-through",
  };
  return (
    <span
      className={`border px-1.5 py-0.5 ${colorMap[status] ?? "border-neutral-400"}`}
    >
      {status}
    </span>
  );
}
