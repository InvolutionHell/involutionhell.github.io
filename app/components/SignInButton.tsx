"use client";

import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
  // 同源跳到 /oauth/render/github，经 next.config.mjs 的 rewrite 代理到后端。
  // 好处：开发环境后端端口改来改去（8080 / 8081）都不用改前端；302 由 Next.js 透传给浏览器，
  // 最终由浏览器跳到 GitHub 授权页。
  // 注意：GitHub OAuth app 注册的 callback URL 决定最终返回的前端端口
  // （当前注册为 localhost:3000/api/auth/callback/github），换端口跑本地时需在 GitHub OAuth app 里补一个。
  const handleSignIn = () => {
    window.location.href = "/oauth/render/github";
  };

  return (
    <Button
      className={className}
      onClick={handleSignIn}
      size="sm"
      variant="outline"
      data-umami-event="auth_click"
      data-umami-event-action="signin"
      data-umami-event-location="header"
    >
      SignIn
    </Button>
  );
}
