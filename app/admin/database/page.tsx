"use client";

/**
 * /admin/database — 数据库管理后台（iframe 嵌入 pgAdmin）。
 *
 * 权限：<AdminGuard required="admin"> 兜底，非 admin 直接 403；
 * 真正的操作权限由 pgAdmin 自身登录（环境变量里的 PGADMIN_EMAIL / PGADMIN_PASSWORD）
 * 把守，前端这层只是"路由可见"。
 *
 * 流量：
 *   浏览器 → involutionhell.com/admin/database
 *     └─ iframe src="https://api.involutionhell.com/admin/pgadmin/"
 *          └─ Caddy /admin/pgadmin/* → 127.0.0.1:8082（pgAdmin 容器）
 *
 * pgAdmin 容器环境里设了 SCRIPT_NAME=/admin/pgadmin，
 * Caddy 响应里剥掉 X-Frame-Options 并换成 CSP frame-ancestors 放行本站主域。
 *
 * 为什么不把 pgAdmin 和主站 UI 做统一风格：
 *   用户明确说"管理员不配享受好 UI"——优先把基础能力接通，视觉一致性排最后。
 */

import { AdminGuard } from "../events/AdminGuard";

// pgAdmin 所在路径。默认打 production Caddy，dev 如果要本地联调可以用
// NEXT_PUBLIC_PGADMIN_URL 覆盖（比如指到 http://localhost:8082/admin/pgadmin/）。
const PGADMIN_URL =
  process.env.NEXT_PUBLIC_PGADMIN_URL ??
  "https://api.involutionhell.com/admin/pgadmin/";

export default function AdminDatabasePage() {
  return (
    <AdminGuard>
      <AdminDatabaseInner />
    </AdminGuard>
  );
}

function AdminDatabaseInner() {
  return (
    <main className="pt-24 pb-0 bg-[var(--background)] min-h-screen flex flex-col">
      <div className="max-w-6xl w-full mx-auto px-6 lg:px-8 pb-4">
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Admin · Database
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-black uppercase mt-2 tracking-tight">
            数据库管理
          </h1>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            下方嵌入的是 pgAdmin。首次进入要用{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              PGADMIN_EMAIL
            </code>{" "}
            /{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              PGADMIN_PASSWORD
            </code>{" "}
            登录（在{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              .env
            </code>{" "}
            里）。 左树自动预注册了 &ldquo;InvolutionHell (local)&rdquo;
            连接，双击即连。 备份/恢复在数据库右键菜单里；定时备份落在{" "}
            <code className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 px-1">
              Storage → backups/
            </code>
            。
          </p>
        </header>
      </div>

      {/* iframe 占满剩余视口，便于操作。高度用 calc 减去 header 高度约 220px。 */}
      <div className="flex-1 border-t border-[var(--foreground)]">
        <iframe
          src={PGADMIN_URL}
          title="pgAdmin"
          className="w-full h-[calc(100vh-220px)] min-h-[600px] border-0"
          // 不加 sandbox：pgAdmin 依赖自己的 cookie + localStorage 保持登录态，
          // 用 sandbox 会屏蔽掉，功能直接残废。允许同源脚本和 form 提交。
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </main>
  );
}
