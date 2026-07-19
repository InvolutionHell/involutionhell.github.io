"use client";

import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
  // 默认 github（header 处无 props 调用不变）；登录页可传 discord。
  provider?: "github" | "discord";
  label?: string;
}

export function SignInButton({
  className,
  provider = "github",
  label = "SignIn",
}: SignInButtonProps) {
  // 同源跳到 /oauth/render/{provider}，经 next.config.mjs 的 rewrite 代理到后端。
  // 好处：开发环境后端端口改来改去都不用改前端；302 由 Next.js 透传给浏览器，
  // 最终跳到 provider 授权页。各 provider 的 OAuth app 回调 URL 决定返回的前端地址。
  const handleSignIn = () => {
    window.location.href = `/oauth/render/${provider}`;
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
      data-umami-event-provider={provider}
    >
      {label}
    </Button>
  );
}
