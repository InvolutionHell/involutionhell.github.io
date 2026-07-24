"use client";

import { useSearchParams } from "next/navigation";

// 登录页顶端的错误提示。后端 OAuth 回调失败会 302 到 /login?error=xxx。
// 用 useSearchParams（客户端读 query）而非 server 读 searchParams，避免整页退回
// 动态渲染（登录页要保持 SSG，见 CLAUDE.md 路由分类约束）。父级用 <Suspense> 包裹。
// 文案由 server 端 getTranslations 取好后作为 prop 传入，省一套 client i18n provider。
export function LoginErrorNotice({
  messages,
}: {
  messages: Record<string, string>;
}) {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const msg = messages[error] ?? messages.generic;
  return (
    <div
      role="alert"
      className="w-full rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      {msg}
    </div>
  );
}
