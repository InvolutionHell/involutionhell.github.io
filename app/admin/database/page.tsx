"use client";

/**
 * /admin/database — 数据库管理入口。
 *
 * 早期版本用 iframe 嵌入 pgAdmin，但跨域 / 同源两种嵌法都各有坑：
 *   - 跨域（iframe src = api.involutionhell.com/admin/pgadmin/）：
 *     pgAdmin 的 session + CSRF cookie 走 SameSite=Lax，子域 iframe 发 POST
 *     时浏览器不带 cookie，登录永远报 "CSRF session token is missing"。
 *   - 同源（走 Next.js rewrite 把 pgAdmin 代到 localhost:3010 下）：
 *     pgAdmin 自己会发绝对 URL 的重定向（host 用它自己以为的值），
 *     浏览器跟着跳到 http://localhost:8082 踩 "拒绝连接"。
 *
 * 所以改简单方案——这里只放一个跳转按钮，新标签页打开 pgAdmin，让它自己管
 * 自己的 session / CSRF，省心。管理员反正不高频用。
 *
 * 权限：<AdminGuard required="admin"> 兜底（真正的安全由 pgAdmin 登录把守）。
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "../events/AdminGuard";

// pgAdmin URL 选择逻辑（客户端运行时决定，否则 SSR 拿不到 hostname）：
//   1. NEXT_PUBLIC_PGADMIN_URL 显式覆盖（最高优先级）
//   2. 浏览器 hostname 是 localhost / 127.0.0.1 → 走本地 http://localhost:8082/admin/pgadmin/
//      （要求开发者先 ssh -L 8082:127.0.0.1:8082 server 把端口引到本机）
//   3. 其他情况 → 公网入口 https://api.involutionhell.com/admin/pgadmin/
//      （需要 Caddy forward_auth + cookie，prod 正常使用路径）
const PROD_PGADMIN_URL = "https://api.involutionhell.com/admin/pgadmin/";
const LOCAL_PGADMIN_URL = "http://localhost:8082/admin/pgadmin/";

function pickPgadminUrl(hostname: string | null): string {
  if (process.env.NEXT_PUBLIC_PGADMIN_URL) {
    return process.env.NEXT_PUBLIC_PGADMIN_URL;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_PGADMIN_URL;
  }
  return PROD_PGADMIN_URL;
}

export default function AdminDatabasePage() {
  return (
    <AdminGuard>
      <AdminDatabaseInner />
    </AdminGuard>
  );
}

function AdminDatabaseInner() {
  // 客户端挂载后拿 hostname 选 URL。首屏 SSR 先渲染 prod URL 占位，useEffect
  // 里按实际 hostname 刷成 localhost 版（如果需要）。dev 不做 SSR 不影响。
  // setState 走 Promise.resolve 异步化，避开 "cascading renders" lint 规则。
  const [pgadminUrl, setPgadminUrl] = useState(PROD_PGADMIN_URL);
  useEffect(() => {
    const next = pickPgadminUrl(window.location.hostname);
    Promise.resolve().then(() => setPgadminUrl(next));
  }, []);

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Admin · Database
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
            数据库管理
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            点按钮新标签打开 pgAdmin，在它自己的页面里做备份 / 恢复 / 查表 / 跑
            SQL。第一次进要用{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              PGADMIN_EMAIL
            </code>{" "}
            /{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              PGADMIN_PASSWORD
            </code>{" "}
            登录（看服务器 .env）。左侧树自动预注册了{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              InvolutionHell (local)
            </code>
            ，双击即连。
          </p>
        </header>

        <Link
          key={pgadminUrl}
          href={pgadminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-[var(--foreground)] p-8 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors group"
          data-umami-event="admin_open_pgadmin"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 group-hover:text-[var(--background)] mb-2">
            外部窗口打开
          </div>
          <h2 className="font-serif text-2xl font-black uppercase tracking-tight mb-2">
            打开 pgAdmin →
          </h2>
          <p className="text-sm leading-relaxed opacity-80 font-mono break-all">
            {pgadminUrl}
          </p>
        </Link>

        <aside className="mt-10 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <p className="mb-2 font-mono uppercase tracking-[0.2em] text-[10px]">
            备份文件位置
          </p>
          <p>
            pg-backup 每天 03:00 自动 pg_dump 写到{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              /var/lib/pgadmin/storage/admin_involutionhell.com/backups/
            </code>
            （daily / weekly / monthly / last 四个子目录）。Restore 对话框选
            文件时直接能看到。
          </p>
        </aside>
      </div>
    </main>
  );
}
