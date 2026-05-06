"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { useTranslations } from "next-intl";

interface Props {
  /** 目标用户的 identifier（/u/{identifier}，数字或 username 都行） */
  identifier: string;
  /** 目标用户的 user_accounts.id，用于判断"不能关注自己" */
  targetUserId: number;
}

interface StatsResponse {
  success: boolean;
  data?: {
    userId: number;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
  };
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("satoken");
  } catch {
    return null;
  }
}

/**
 * 个人主页上的关注按钮 + 统计。
 * - 匿名用户显示 followers/following 数字但按钮置灰提示"登录后关注"
 * - 自己访问自己主页时不显示按钮，只显示统计
 * - 乐观更新：点击立即切换 UI，失败回滚
 */
export function FollowButton({ identifier, targetUserId }: Props) {
  const { user, status } = useAuth();
  const t = useTranslations("profile.follow");
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  const isSelf = user?.id === targetUserId;

  // 初次载入拉 stats
  useEffect(() => {
    const token = readToken();
    fetch(`/api/user-center/follows/stats/${encodeURIComponent(identifier)}`, {
      headers: token ? { satoken: token } : {},
    })
      .then((r) => (r.ok ? (r.json() as Promise<StatsResponse>) : null))
      .then((json) => {
        if (!json?.success || !json.data) return;
        setFollowerCount(json.data.followerCount);
        setFollowingCount(json.data.followingCount);
        setIsFollowing(json.data.isFollowing);
      })
      .catch(() => {});
  }, [identifier]);

  async function toggle() {
    if (status !== "authenticated" || isSelf || pending) return;
    const token = readToken();
    if (!token) return;

    const nextFollowing = !isFollowing;
    // 乐观更新
    setPending(true);
    setIsFollowing(nextFollowing);
    setFollowerCount((c) =>
      c == null ? c : Math.max(0, c + (nextFollowing ? 1 : -1)),
    );

    try {
      const res = await fetch(
        `/api/user-center/follows/${encodeURIComponent(identifier)}`,
        {
          method: nextFollowing ? "POST" : "DELETE",
          headers: { satoken: token },
        },
      );
      if (!res.ok) {
        // 回滚
        setIsFollowing(!nextFollowing);
        setFollowerCount((c) =>
          c == null ? c : Math.max(0, c - (nextFollowing ? 1 : -1)),
        );
      } else {
        // 以服务端为准修正计数
        const json = (await res.json()) as StatsResponse;
        if (json.success && json.data) {
          setFollowerCount(json.data.followerCount);
          setFollowingCount(json.data.followingCount);
          setIsFollowing(json.data.isFollowing);
        }
      }
    } catch {
      // 网络异常回滚
      setIsFollowing(!nextFollowing);
      setFollowerCount((c) =>
        c == null ? c : Math.max(0, c - (nextFollowing ? 1 : -1)),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-4 border-t border-[var(--foreground)] pt-4">
      <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        <span>
          <strong className="text-[var(--foreground)] font-serif text-base font-black">
            {followerCount?.toLocaleString() ?? "—"}
          </strong>{" "}
          {t("followers")}
        </span>
        <span>
          <strong className="text-[var(--foreground)] font-serif text-base font-black">
            {followingCount?.toLocaleString() ?? "—"}
          </strong>{" "}
          {t("following")}
        </span>
      </div>
      {!isSelf && (
        <button
          type="button"
          disabled={status !== "authenticated" || pending}
          onClick={toggle}
          className={[
            "font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors",
            isFollowing
              ? "border-[var(--foreground)] text-[var(--foreground)] hover:bg-[#CC0000] hover:border-[#CC0000] hover:text-[var(--background)]"
              : "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
          data-umami-event={isFollowing ? "unfollow_click" : "follow_click"}
        >
          {status !== "authenticated"
            ? t("signInToFollow")
            : pending
              ? "..."
              : isFollowing
                ? t("unfollow")
                : t("follow")}
        </button>
      )}
    </div>
  );
}
