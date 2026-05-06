"use client";

/**
 * /admin/events/new — 新建活动。
 * 纯表单页，复用 <EventForm>。
 */

import Link from "next/link";
import { AdminGuard } from "../AdminGuard";
import { EventForm } from "../EventForm";

export default function NewEventPage() {
  return (
    <AdminGuard>
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Link
            href="/admin/events"
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000] transition-colors"
          >
            ← 返回活动列表
          </Link>
          <header className="mt-4 border-t-4 border-[var(--foreground)] pt-6 mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Admin · Events · New
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
              新建活动
            </h1>
          </header>
          <EventForm />
        </div>
      </main>
    </AdminGuard>
  );
}
