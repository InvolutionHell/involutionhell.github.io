"use client";

/**
 * /admin/community — 管理员审核社区分享链接。
 *
 * 权限：包在 <AdminGuard> 里。
 * 数据：GET /api/admin/community/pending 拉 PENDING_MANUAL + FLAGGED 两种状态。
 * 交互：每条两个动作——通过（→ APPROVED）/ 拒绝（→ REJECTED）。
 *
 * 为什么不用复杂表格：v1 预计审核频率很低（每周一次扫），
 * 简单的卡片列表加两按钮足矣；后续量大了再做分页 + 批量操作。
 */

import { useEffect, useState } from "react";
import { AdminGuard } from "@/app/admin/events/AdminGuard";
import type { SharedLinkView } from "@/app/feed/types";
import { sanitizeExternalUrl } from "@/lib/url-safety";
import { approveLink, listPendingLinks, rejectLink } from "./lib";

export default function AdminCommunityPage() {
  return (
    <AdminGuard>
      <AdminCommunityInner />
    </AdminGuard>
  );
}

// FLAGGED 的原因标签（来自后端 AI 判定的 flags JSON）
function renderFlagBadges(link: SharedLinkView) {
  // flags 目前前端 DTO 里没直接暴露，这里预留位——M7 后端返回 flags 后再补
  if (link.status !== "FLAGGED") return null;
  return (
    <span className="rounded-full bg-red-100 text-red-900 px-2 py-0.5 text-xs font-medium">
      AI 判定需要复核
    </span>
  );
}

function AdminCommunityInner() {
  const [links, setLinks] = useState<SharedLinkView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 记录正在处理的 link id，避免一条链接按两次
  const [workingId, setWorkingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setLinks(await listPendingLinks());
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onApprove = async (id: number) => {
    setWorkingId(id);
    try {
      await approveLink(id);
      // 审核后直接从列表中移除（通过的不再出现在待审）
      setLinks((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "通过失败");
    } finally {
      setWorkingId(null);
    }
  };

  const onReject = async (id: number) => {
    const reason = prompt("拒绝原因（可选，留空直接拒绝）：") ?? undefined;
    setWorkingId(id);
    try {
      await rejectLink(id, reason || undefined);
      setLinks((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "拒绝失败");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <header className="border-t-4 border-[var(--foreground)] pt-6 mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
            Admin · Community
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-black uppercase mt-2 tracking-tight">
            社区分享审核
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            这里列出所有 PENDING_MANUAL（非白名单域名）和 FLAGGED（AI 判定风险）
            的链接。审核频率预期很低（每周一次），按需处理即可。
          </p>
        </header>

        {loading && <p className="text-sm text-neutral-500">加载中...</p>}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            加载失败：{error}
            <button
              className="ml-3 underline"
              type="button"
              onClick={() => void load()}
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && links.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-neutral-500">
            当前没有需要审核的链接。
          </div>
        )}

        {!loading && links.length > 0 && (
          <ul className="space-y-4">
            {links.map((link) => (
              <li
                key={link.id}
                className="border border-[var(--foreground)]/40 p-4 flex flex-col md:flex-row gap-4"
              >
                {/* 左：OG 封面缩略图（没抓到就占位）。
                    改用 <img> + referrerPolicy="no-referrer"：微信/知乎/小红书
                    图床防盗链会检查 Referer，非本站来源返回"未经允许"裂图。
                    next/image 的 remotePatterns 限制外站域名也一并规避。 */}
                <div className="w-full md:w-40 aspect-[16/9] flex-shrink-0 bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden">
                  {link.ogCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={link.ogCover}
                      alt={link.ogTitle ?? link.url}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-neutral-400">
                      {link.host[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>

                {/* 中：元信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        link.status === "FLAGGED"
                          ? "bg-red-100 text-red-900"
                          : "bg-orange-100 text-orange-900"
                      }`}
                    >
                      {link.status === "FLAGGED" ? "AI 标记" : "非白名单"}
                    </span>
                    {renderFlagBadges(link)}
                    <span className="text-xs text-neutral-500 font-mono">
                      {link.host}
                    </span>
                  </div>
                  {(() => {
                    // defense-in-depth：后端 UrlNormalizer 已拒非 http/https，
                    // 前端仍用 sanitizeExternalUrl 兜底过滤 javascript:/data: 协议。
                    const safe = sanitizeExternalUrl(link.url);
                    const title = link.ogTitle ?? link.url;
                    return safe ? (
                      <a
                        href={safe}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 font-semibold text-base hover:underline truncate"
                        title={title}
                      >
                        {title}
                      </a>
                    ) : (
                      <span
                        className="block mt-2 font-semibold text-base text-neutral-400 truncate"
                        title="链接协议不安全，已禁用点击"
                      >
                        {title} ⚠
                      </span>
                    );
                  })()}
                  {link.ogDescription && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                      {link.ogDescription}
                    </p>
                  )}
                  {link.recommendation && (
                    <p className="mt-2 text-xs text-neutral-500 italic">
                      推荐：{link.recommendation}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">
                    提交人 #{link.submitterId} ·{" "}
                    {new Date(link.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* 右：操作按钮 */}
                <div className="flex md:flex-col gap-2 md:w-32 md:flex-shrink-0">
                  <button
                    type="button"
                    disabled={workingId === link.id}
                    onClick={() => void onApprove(link.id)}
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase tracking-wider bg-[var(--foreground)] text-[var(--background)] hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {workingId === link.id ? "..." : "通过"}
                  </button>
                  <button
                    type="button"
                    disabled={workingId === link.id}
                    onClick={() => void onReject(link.id)}
                    className="flex-1 px-3 py-2 text-sm font-mono uppercase tracking-wider border border-[var(--foreground)] hover:bg-[#CC0000] hover:text-white hover:border-[#CC0000] transition-colors disabled:opacity-50"
                  >
                    拒绝
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
