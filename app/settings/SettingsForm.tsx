"use client";

// 用户偏好设置表单（Client Component）
// 负责：拉取偏好数据、渲染编辑 UI、提交保存、同步 ThemeProvider

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useTheme } from "@/app/components/ThemeProvider";

// 与后端 preferences 字段一一对应
interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "zh" | "en";
  aiDefaultProvider: "intern" | "openai" | "gemini";
}

const DEFAULT_PREFS: UserPreferences = {
  theme: "system",
  language: "zh",
  aiDefaultProvider: "intern",
};

// 从 localStorage 读取 satoken
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("satoken");
}

// 骨架屏占位
function SkeletonRow() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
      <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded w-full" />
    </div>
  );
}

export function SettingsForm() {
  const { status } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  // toast 定时器 ref：新 toast / 卸载时清掉旧 timer，避免 setState on unmounted
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 未登录时重定向
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/settings");
    }
  }, [status, router]);

  // 拉取偏好数据
  useEffect(() => {
    if (status !== "authenticated") return;
    const token = getToken();
    // token 缺失时立刻结束 loading 并提示 + 跳转，否则页面会卡在骨架屏
    if (!token) {
      setLoading(false);
      showToast("error", "登录态丢失，请重新登录");
      router.replace("/login?redirect=/settings");
      return;
    }

    fetch("/api/user-center/preferences", {
      headers: { satoken: token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("获取偏好失败");
        return res.json();
      })
      .then((body) => {
        if (body?.success && body?.data) {
          const merged = { ...DEFAULT_PREFS, ...body.data };
          setPrefs(merged);
          // 加载出来的 theme 立即同步到 ThemeProvider，避免"已保存设置与当前主题不一致"
          setTheme(merged.theme);
        }
      })
      .catch(() => {
        showToast("error", "无法加载偏好设置，已显示默认值");
      })
      .finally(() => setLoading(false));
    // setTheme 是 ThemeProvider 提供的稳定引用，router 同理；这里依赖 status 变化触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 组件卸载时清掉残留 toast timer
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(type: "success" | "error", msg: string) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    const token = getToken();
    // token 缺失时给明确反馈并跳转登录，而不是静默返回让用户摸不着头脑
    if (!token) {
      showToast("error", "登录态丢失，请重新登录后再保存");
      router.replace("/login?redirect=/settings");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user-center/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          satoken: token,
        },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("保存失败");
      const body = await res.json();
      if (body?.data) {
        const merged: UserPreferences = { ...DEFAULT_PREFS, ...body.data };
        setPrefs(merged);
        // 主题变化立即同步到 ThemeProvider（同步写 localStorage）
        setTheme(merged.theme);
      }
      showToast("success", "偏好设置已保存");
    } catch {
      showToast("error", "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  // 加载中或未登录均显示骨架屏，避免闪烁
  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col gap-8">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  // 未认证时页面已重定向，此处不需要渲染
  if (status === "unauthenticated") return null;

  const themeOptions: { value: UserPreferences["theme"]; label: string }[] = [
    { value: "light", label: "浅色" },
    { value: "dark", label: "深色" },
    { value: "system", label: "跟随系统" },
  ];

  const langOptions: { value: UserPreferences["language"]; label: string }[] = [
    { value: "zh", label: "中文" },
    { value: "en", label: "English" },
  ];

  const aiOptions: {
    value: UserPreferences["aiDefaultProvider"];
    label: string;
  }[] = [
    { value: "intern", label: "书生（InternLM）" },
    { value: "openai", label: "OpenAI" },
    { value: "gemini", label: "Gemini" },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Toast 提示 */}
      {toast && (
        <div
          className={`border px-4 py-3 font-mono text-sm ${
            toast.type === "success"
              ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
              : "border-red-500 text-red-600 dark:text-red-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 主题设置 */}
      <section>
        <label className="block font-serif font-bold text-lg mb-3 uppercase tracking-wide">
          主题
        </label>
        <div className="flex gap-0 border border-[var(--foreground)]">
          {themeOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, theme: value }))}
              className={`flex-1 py-2 px-4 font-mono text-sm uppercase transition-colors ${
                prefs.theme === value
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-transparent text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* 语言设置 */}
      <section>
        <label className="block font-serif font-bold text-lg mb-3 uppercase tracking-wide">
          语言
        </label>
        <div className="flex gap-0 border border-[var(--foreground)]">
          {langOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, language: value }))}
              className={`flex-1 py-2 px-4 font-mono text-sm uppercase transition-colors ${
                prefs.language === value
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-transparent text-[var(--foreground)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* AI 默认提供商 */}
      <section>
        <label
          htmlFor="ai-provider"
          className="block font-serif font-bold text-lg mb-3 uppercase tracking-wide"
        >
          AI 默认提供商
        </label>
        <select
          id="ai-provider"
          value={prefs.aiDefaultProvider}
          onChange={(e) =>
            setPrefs((p) => ({
              ...p,
              aiDefaultProvider: e.target
                .value as UserPreferences["aiDefaultProvider"],
            }))
          }
          className="w-full border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] font-mono text-sm px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
        >
          {aiOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      {/* 提交按钮 */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="font-mono text-sm uppercase tracking-widest px-8 py-3 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-transparent hover:text-[var(--foreground)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}
