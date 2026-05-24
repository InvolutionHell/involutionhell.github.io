import Link from "next/link";
import type { PostSummaryView } from "@/app/types/post";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: PostSummaryView;
  /** 是否显示作者头像和用户名（feed 页显示，个人主页隐藏） */
  showAuthor?: boolean;
}

/** 格式化 ISO-8601 时间为本地日期字符串，仅用 YYYY-MM-DD */
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * 原创文章卡片。
 * /feed 原创 Tab 和 /u/[username]/posts 列表均复用此组件。
 * 点击整卡跳转到 /u/{authorUsername}/posts/{slug}。
 */
export function PostCard({ post, showAuthor = false }: PostCardProps) {
  const href = `/u/${post.authorUsername}/posts/${post.slug}`;

  return (
    <li className="relative border border-[var(--foreground)] hover:border-[#CC0000] transition-colors group">
      {/* 已收录角标：绝对定位右上角，不占内容流 */}
      {post.promoted && (
        <span className="absolute top-0 right-0 font-mono text-[9px] uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] px-2 py-1 z-10">
          已收录 /docs
        </span>
      )}
      <Link href={href} className="block flex flex-col h-full">
        {/* 封面图：有 coverUrl 时展示 16:9，无则跳过不留空白 */}
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover border-b border-[var(--foreground)]"
          />
        )}

        {/* 卡片内容区 */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* 第一行：发布时间 + 作者（showAuthor=true 时） */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-neutral-400">
                {formatDate(post.createdAt)}
              </span>
            </div>
            {showAuthor && (
              <div className="flex items-center gap-1">
                {post.authorAvatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.authorAvatar}
                    alt={post.authorDisplayName ?? post.authorUsername}
                    className="w-5 h-5 rounded-full border border-[var(--foreground)]"
                  />
                )}
                <span className="font-mono text-[10px] text-neutral-500">
                  @{post.authorUsername}
                </span>
              </div>
            )}
          </div>

          {/* 标题 */}
          <h3 className="font-serif text-base font-black leading-snug group-hover:text-[#CC0000] transition-colors line-clamp-2 text-[var(--foreground)]">
            {post.title}
          </h3>

          {/* 摘要 */}
          {post.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
          )}

          {/* tags */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
              {post.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="font-mono text-[9px] uppercase tracking-widest rounded-none border-[var(--foreground)]/40 text-neutral-500"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
