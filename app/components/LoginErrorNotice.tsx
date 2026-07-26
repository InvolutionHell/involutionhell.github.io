"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

// 后端 OAuth 回调失败会 302 到 /login?error=<code>，这里把 code 映射成 i18n key。
//
// 必须是显式白名单 + Object.hasOwn，不能拿 error 直接当对象索引：那样会命中原型链，
// ?error=__proto__ 取到的是 Object.prototype（对象而非 undefined，所以 ?? 兜底不
// 触发），把非字符串交给 React 渲染会抛错；/login 没有 error boundary，整个登录页
// 会被替换成 Application error，连 GitHub 登录一起不可用。
const ERROR_KEYS: Record<string, string> = {
  discord_canary: "errorDiscordCanary",
  oauth_state: "errorOauthState",
  oauth_provider: "errorOauthProvider",
  oauth_failed: "errorGeneric",
};

/** null 表示不显示提示。未知 code 一律落到通用文案，绝不透传原值。 */
export function resolveErrorKey(error: string | null): string | null {
  if (!error) return null;
  return Object.hasOwn(ERROR_KEYS, error) ? ERROR_KEYS[error]! : "errorGeneric";
}

// 用 useSearchParams（客户端读 query）而非 server 读 searchParams，避免整页退回
// 动态渲染（登录页要保持 SSG，见 CLAUDE.md 路由分类约束）。父级用 <Suspense> 包裹。
export function LoginErrorNotice() {
  const t = useTranslations("login");
  const key = resolveErrorKey(useSearchParams().get("error"));
  if (!key) return null;
  return (
    <div
      role="alert"
      className="w-full rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      {t(key)}
    </div>
  );
}
