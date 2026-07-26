"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

type LinkedIdentity = {
  provider: string;
  displayNameAtLink: string | null;
  linkedAt: string | null;
  lastLoginAt: string | null;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("satoken");
}

// 只是展示名。后端 /identities/providers 才是"有哪些登录方式"的真相源，
// 这里查不到就回退显示原始 key，保证新接入的 provider 不会静默消失。
const PROVIDER_LABEL: Record<string, string> = {
  github: "GitHub",
  discord: "Discord",
};

function labelOf(provider: string): string {
  return Object.hasOwn(PROVIDER_LABEL, provider)
    ? PROVIDER_LABEL[provider]!
    : provider;
}

// 后端绑定回调会跳回 /settings?bind=ok 或 ?bind_error=<code>
const BIND_ERROR_KEYS: Record<string, string> = {
  bind_taken: "bindTaken",
  bind_duplicate: "bindDuplicate",
  bind_already_yours: "bindAlreadyYours",
  bind_session: "bindSession",
  oauth_state: "bindFailed",
  oauth_provider: "bindFailed",
  oauth_failed: "bindFailed",
};

/**
 * 已绑定登录方式的查看 / 绑定（M2b） / 解绑（M2a）。
 *
 * 绑定必须走 /oauth/bind/{provider} 而不是普通登录入口：后者会把用户登成新账号
 * （分叉），而分叉之后那个第三方身份就被新账号占住，本尊再也补绑不回来。
 */
export function LinkedAccounts() {
  const t = useTranslations("settings.linked");
  const [items, setItems] = useState<LinkedIdentity[] | null>(null);
  const [supported, setSupported] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const params = useSearchParams();

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [identities, providers] = await Promise.all([
        fetch("/api/user-center/identities", { headers: { satoken: token } }),
        fetch("/api/user-center/identities/providers", {
          headers: { satoken: token },
        }),
      ]);
      if (!identities.ok) throw new Error();
      setItems((await identities.json()).data ?? []);
      if (providers.ok) setSupported((await providers.json()).data ?? []);
      setError(null);
    } catch {
      setError(t("loadFail"));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // 绑定回调结果：成功给提示，失败给出可区分的原因（"已被别的账号占用"等）
  useEffect(() => {
    if (params.get("bind") === "ok") {
      setNotice(t("bindOk"));
      return;
    }
    const code = params.get("bind_error");
    if (!code) return;
    setError(
      t(
        Object.hasOwn(BIND_ERROR_KEYS, code)
          ? BIND_ERROR_KEYS[code]!
          : "bindFailed",
      ),
    );
  }, [params, t]);

  async function unbind(provider: string) {
    const token = getToken();
    if (!token) return;
    setBusy(provider);
    try {
      const res = await fetch(`/api/user-center/identities/${provider}`, {
        method: "DELETE",
        headers: { satoken: token },
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        // 后端把"最后一种登录方式不能解绑"等作为 400 + message 返回
        setError(body.message ?? t("unbindFail"));
        return;
      }
      setItems(body.data ?? []);
      setError(null);
    } catch {
      setError(t("unbindFail"));
    } finally {
      setBusy(null);
    }
  }

  if (items === null && !error) return null; // 未登录或加载中，保持安静

  const bound = items ?? [];
  const boundKeys = new Set(bound.map((i) => i.provider));
  const bindable = supported.filter((p) => !boundKeys.has(p));

  return (
    <section className="mt-10">
      <label className="block font-serif font-bold text-lg mb-3">
        {t("label")}
      </label>
      {notice && (
        <p className="font-mono text-xs text-green-700 dark:text-green-400 mb-3">
          {notice}
        </p>
      )}
      {error && (
        <p className="font-mono text-xs text-[#CC0000] mb-3">{error}</p>
      )}
      <ul className="border border-[var(--foreground)] divide-y divide-[var(--foreground)]/20">
        {bound.map((it) => (
          <li
            key={it.provider}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="font-mono text-sm text-[var(--foreground)]">
              {labelOf(it.provider)}
              {it.displayNameAtLink ? ` · ${it.displayNameAtLink}` : ""}
            </span>
            <button
              type="button"
              onClick={() => unbind(it.provider)}
              disabled={busy === it.provider || bound.length <= 1}
              title={bound.length <= 1 ? t("lastHint") : undefined}
              className="font-mono text-xs uppercase tracking-widest text-[var(--foreground)]/70 hover:text-[#CC0000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy === it.provider ? "…" : t("unbind")}
            </button>
          </li>
        ))}
        {bindable.map((p) => (
          <li key={p} className="flex items-center justify-between px-4 py-3">
            <span className="font-mono text-sm text-[var(--foreground)]/50">
              {labelOf(p)}
            </span>
            <a
              href={`/oauth/bind/${p}`}
              className="font-mono text-xs uppercase tracking-widest text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
            >
              {t("connect")}
            </a>
          </li>
        ))}
        {bound.length === 0 && bindable.length === 0 && (
          <li className="px-4 py-3 font-mono text-sm text-neutral-500">
            {t("empty")}
          </li>
        )}
      </ul>
    </section>
  );
}
