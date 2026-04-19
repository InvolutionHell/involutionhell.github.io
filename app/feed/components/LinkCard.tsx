/**
 * 社区分享链接卡片。
 * - 整卡可点击，跳转到原文（target="_blank"）
 * - OG 封面：有则显示，没有则渲染 host 首字母占位块
 * - 举报按钮由 ReportButton 组件负责，阻止冒泡不触发整卡跳转
 * - 服务端渲染（纯展示，无 client state），ReportButton 是 client 组件
 */

import { useTranslations } from "next-intl";
import type { SharedLinkView } from "@/app/feed/types";
import { ReportButton } from "@/app/feed/components/ReportButton";
import { Badge } from "@/components/ui/badge";

interface LinkCardProps {
  link: SharedLinkView;
  /** 分类显示名（由父组件从 i18n 翻译后传入，避免在纯 server 组件里调 useTranslations） */
  categoryLabel: string;
  /** 当前用户是否已登录（影响举报按钮行为） */
  isLoggedIn: boolean;
}

/** 从 host 字符串提取首字母大写，作为封面占位符 */
function getHostInitial(host: string): string {
  const cleaned = host.replace(/^www\./, "");
  return (cleaned[0] ?? "?").toUpperCase();
}

export function LinkCard({ link, categoryLabel, isLoggedIn }: LinkCardProps) {
  const t = useTranslations("feed.card");

  return (
    <li className="group border border-[var(--foreground)] hover:border-[#CC0000] transition-colors duration-150 flex flex-col">
      {/* 整卡可点击区域，跳到原文 */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col flex-1"
        aria-label={link.ogTitle ?? link.url}
      >
        {/* OG 封面 / 占位块 */}
        {link.ogCover && !link.ogFetchFailed ? (
          // next/image 全站 unoptimized:true，用 img 即可（与 events 页一致）
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.ogCover}
            alt={link.ogTitle ?? link.host}
            className="w-full aspect-[16/9] object-cover border-b border-[var(--foreground)]"
          />
        ) : (
          // 无封面：显示 host 首字母占位
          <div className="w-full aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 border-b border-[var(--foreground)] flex flex-col items-center justify-center gap-1">
            <span className="font-serif text-4xl font-black text-neutral-400 select-none">
              {getHostInitial(link.host)}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              {link.host}
            </span>
            {link.ogFetchFailed && (
              // OG 抓取失败时给用户一个弱提示
              <span className="font-mono text-[9px] text-neutral-400 mt-1">
                {t("ogFallback")}
              </span>
            )}
          </div>
        )}

        {/* 卡片内容区 */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* 标题 */}
          <h3 className="font-serif text-base font-black leading-snug group-hover:text-[#CC0000] transition-colors line-clamp-2 text-[var(--foreground)]">
            {link.ogTitle ?? link.url}
          </h3>

          {/* OG 描述 / 用户推荐语 */}
          {(link.recommendation || link.ogDescription) && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
              {/* 用户推荐语优先展示，没有则展示 OG description */}
              {link.recommendation ?? link.ogDescription}
            </p>
          )}

          {/* 分类 badge + 失效标记 */}
          <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
            {link.category && (
              <Badge
                variant="outline"
                className="font-mono text-[9px] uppercase tracking-widest rounded-none border-[var(--foreground)]/40 text-neutral-500"
              >
                {categoryLabel}
              </Badge>
            )}
            {link.status === "ARCHIVED" && (
              <Badge
                variant="outline"
                className="font-mono text-[9px] uppercase tracking-widest rounded-none border-[#CC0000]/60 text-[#CC0000]"
              >
                {t("archivedBadge")}
              </Badge>
            )}
          </div>

          {/* 提交人 + host 来源 */}
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
            <span className="truncate max-w-[60%]">{link.host}</span>
          </div>
        </div>
      </a>

      {/* 举报区：与整卡点击分离（ReportButton 内部阻止冒泡） */}
      <div className="px-4 pb-3 border-t border-[var(--foreground)]/10 pt-2 flex justify-end">
        <ReportButton linkId={link.id} isLoggedIn={isLoggedIn} />
      </div>
    </li>
  );
}
