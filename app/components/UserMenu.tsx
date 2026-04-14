"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  provider?: string;
  // 退出登录回调，由父组件传入（来自 useAuth().logout）
  logout: () => Promise<void>;
}

export function UserMenu({ user, provider, logout }: UserMenuProps) {
  const initials = user.name?.[0] ?? user.email?.[0] ?? "?";

  return (
    <details className="relative inline-block text-left">
      <summary
        className="flex cursor-pointer list-none items-center rounded-full border border-border bg-background p-0.5 transition hover:border-primary/60 [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
        data-umami-event="user_menu_click"
      >
        <Avatar className="size-9">
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? "User avatar"} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
      </summary>

      <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-md border border-border bg-popover shadow-lg z-50">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {user.name ?? "Signed in"}
          </p>
          {user.email ? (
            <p className="text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </p>
          ) : null}
        </div>

        {/* 设置入口：登录用户均可见，指向 /settings 偏好页 */}
        <Link
          href="/settings"
          className="block px-4 py-2 text-sm text-foreground transition hover:bg-muted"
          data-umami-event="user_menu_settings_click"
        >
          设置
        </Link>

        {provider === "github" ? (
          <a
            href="https://github.com/logout"
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            切换 GitHub 账号（将在新标签页登出 GitHub）
          </a>
        ) : null}

        <button
          onClick={() => void logout()}
          className="w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
