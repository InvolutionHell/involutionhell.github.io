"use client";

import { Button } from "@/app/components/ui/button";

interface SignInButtonProps {
  className?: string;
  // 传了 provider（登录页两个按钮）→ 直跳该 provider 授权；
  // 不传（header 的 "Sign In"）→ 跳 /login 让用户在 GitHub / Discord 间选。
  provider?: "github" | "discord";
  label?: string;
}

export function SignInButton({
  className,
  provider,
  label = "SignIn",
}: SignInButtonProps) {
  // provider 已定：同源跳 /oauth/render/{provider}，经 next.config rewrite 代理到后端。
  // provider 未定：跳 /login 选择页（middleware 会补 locale 前缀）。
  const handleSignIn = () => {
    window.location.href = provider ? `/oauth/render/${provider}` : "/login";
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
      data-umami-event-provider={provider ?? "choose"}
    >
      {label}
    </Button>
  );
}
