"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

const PROVIDER_LABEL: Record<string, string> = {
  github: "GitHub",
  discord: "Discord",
};

/**
 * 已绑定登录方式的查看 + 解绑（后端 M2a）。绑定新 provider 走 OAuth 流程，
 * 待绑定流程（M2b）上线后再加"连接"按钮——现在加会把用户登成新账号（分叉）。
 */
export function LinkedAccounts() {
  const t = useTranslations("settings.linked");
  const [items, setItems] = useState<LinkedIdentity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/user-center/identities", {
        headers: { satoken: token },
      });
      if (!res.ok) throw new Error();
      const body = await res.json();
      setItems(body.data ?? []);
      setError(null);
    } catch {
      setError(t("loadFail"));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <section className="mt-10">
      <label className="block font-serif font-bold text-lg mb-3">
        {t("label")}
      </label>
      {error && (
        <p className="font-mono text-xs text-[#CC0000] mb-3">{error}</p>
      )}
      <ul className="border border-[var(--foreground)] divide-y divide-[var(--foreground)]/20">
        {(items ?? []).map((it) => (
          <li
            key={it.provider}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="font-mono text-sm text-[var(--foreground)]">
              {PROVIDER_LABEL[it.provider] ?? it.provider}
              {it.displayNameAtLink ? ` · ${it.displayNameAtLink}` : ""}
            </span>
            <button
              type="button"
              onClick={() => unbind(it.provider)}
              disabled={busy === it.provider || (items ?? []).length <= 1}
              title={(items ?? []).length <= 1 ? t("lastHint") : undefined}
              className="font-mono text-xs uppercase tracking-widest text-[var(--foreground)]/70 hover:text-[#CC0000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy === it.provider ? "…" : t("unbind")}
            </button>
          </li>
        ))}
        {(items ?? []).length === 0 && (
          <li className="px-4 py-3 font-mono text-sm text-neutral-500">
            {t("empty")}
          </li>
        )}
      </ul>
    </section>
  );
}
