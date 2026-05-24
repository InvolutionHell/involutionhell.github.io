import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import PostContent from "@/app/components/PostContent";
import { PostDetailOwnerActions } from "./PostDetailOwnerActions";
import type { PostView } from "@/app/types/post";
import { Badge } from "@/components/ui/badge";

// noindex：posts 是 UGC 直发，不走 SEO 收录，双重保险（metadata + robots.ts）
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function fetchPost(
  username: string,
  slug: string,
): Promise<PostView | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  const url = `${backendUrl}/api/posts/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
  let res: Response;
  try {
    // 详情页走 SSR（cache: "no-store"），内容可能随时更新
    res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    });
  } catch (err) {
    throw new Error(`fetch post failed: ${String(err)}`);
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`post backend ${res.status} for ${username}/${slug}`);
  }

  const json = (await res.json()) as { success: boolean; data?: PostView };
  if (!json.success || !json.data) return null;
  return json.data;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { username, slug } = await params;
  const post = await fetchPost(username, slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="pt-32 pb-16 bg-[var(--background)] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          {/* 页面头部（border-t-4 对齐 /feed 和 /u/[username] 页风格） */}
          <header className="border-t-4 border-[var(--foreground)] pt-6 mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
              Community · Posts
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h1 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)] flex-1 min-w-0">
                {post.title}
              </h1>

              {/* owner 按钮组：client 组件，内部判定是否为作者 */}
              <PostDetailOwnerActions
                postId={post.id}
                postSlug={post.slug}
                authorUsername={post.authorUsername}
                promotedAt={post.promotedAt}
                title={post.title}
                description={post.description}
                tags={post.tags}
                contentMd={post.contentMd}
              />
            </div>
          </header>

          {/* 作者 + 时间 */}
          <div className="flex items-center gap-3 border-b border-[var(--foreground)] pb-4 mb-8">
            {post.authorAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.authorAvatar}
                alt={post.authorDisplayName ?? post.authorUsername}
                className="w-8 h-8 rounded-full border-2 border-[var(--foreground)]"
              />
            )}
            <span className="font-mono text-xs text-neutral-500">
              @{post.authorUsername}
            </span>
            <span className="font-mono text-[10px] text-neutral-400">·</span>
            <span className="font-mono text-[10px] text-neutral-400">
              {formatDate(post.createdAt)}
            </span>
          </div>

          {/* 正文：PostContent 带 prose 样式 */}
          <PostContent
            content={post.contentMd}
            className={[
              "prose prose-neutral dark:prose-invert max-w-2xl",
              "prose-headings:font-serif prose-headings:font-black prose-headings:uppercase",
              "prose-a:text-[#CC0000] prose-a:no-underline hover:prose-a:underline",
              "prose-pre:border prose-pre:border-[var(--foreground)] prose-pre:rounded-none",
            ].join(" ")}
          />

          {/* tags */}
          {post.tags.length > 0 && (
            <div className="border-t border-[var(--foreground)]/40 pt-6 mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
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
      </main>
      <Footer />
    </>
  );
}
