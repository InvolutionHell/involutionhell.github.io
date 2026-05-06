"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useTranslations } from "next-intl";

interface LinkItem {
  label: string;
  url: string;
}

interface ProjectItem {
  title: string;
  description: string;
  url: string;
  tags: string[];
}

interface PaperItem {
  /** Zotero group item key；填了之后 profile 页会自动拉 Zotero 元信息填充 */
  itemKey: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  abstract: string;
}

interface Preferences {
  bio: string;
  tagline: string;
  links: LinkItem[];
  projects: ProjectItem[];
  pinned_papers: PaperItem[];
}

const EMPTY_PREFS: Preferences = {
  bio: "",
  tagline: "",
  links: [],
  projects: [],
  pinned_papers: [],
};

/**
 * 从 localStorage 读 satoken。SSR 下返回 null。
 */
function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("satoken");
  } catch {
    return null;
  }
}

/**
 * 把后端 preferences JSON 规范化成表单 state。允许部分字段缺失。
 */
function normalize(raw: unknown): Preferences {
  const p = (raw as Partial<Preferences>) ?? {};
  return {
    bio: typeof p.bio === "string" ? p.bio : "",
    tagline: typeof p.tagline === "string" ? p.tagline : "",
    links: Array.isArray(p.links)
      ? p.links.map((l) => ({
          label: l?.label ?? "",
          url: l?.url ?? "",
        }))
      : [],
    projects: Array.isArray(p.projects)
      ? p.projects.map((x) => ({
          title: x?.title ?? "",
          description: x?.description ?? "",
          url: x?.url ?? "",
          tags: Array.isArray(x?.tags) ? x.tags : [],
        }))
      : [],
    pinned_papers: Array.isArray(p.pinned_papers)
      ? p.pinned_papers.map((x) => ({
          itemKey: x?.itemKey ?? "",
          title: x?.title ?? "",
          authors: x?.authors ?? "",
          year: String(x?.year ?? ""),
          url: x?.url ?? "",
          abstract: x?.abstract ?? "",
        }))
      : [],
  };
}

interface Props {
  /** 来自 URL 的 /u/[username]，用来验证访问者是不是本人 */
  targetIdentifier: string;
}

/**
 * 编辑个人主页客户端表单。
 * - 用 useAuth 读当前用户 → 判断是否是本人；不是就直接拒绝
 * - 初始化时 GET /api/user-center/preferences 填入已有值
 * - 提交时 PATCH /api/user-center/preferences（顶层 key 原子合并）
 */
export function EditProfileForm({ targetIdentifier }: Props) {
  const { user, status } = useAuth();
  const router = useRouter();
  const t = useTranslations("profile.edit");

  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 仅本人可编辑：URL username 需要能匹配到当前用户（数字 github_id 或字符串 username）
  const isOwner = (() => {
    if (!user) return false;
    if (user.username === targetIdentifier) return true;
    if (user.githubId != null && String(user.githubId) === targetIdentifier)
      return true;
    return false;
  })();

  useEffect(() => {
    if (status !== "authenticated" || !isOwner) {
      setLoading(false);
      return;
    }
    const token = readToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("/api/user-center/preferences", {
      headers: { satoken: token },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success) setPrefs(normalize(json.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, isOwner]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const token = readToken();
    if (!token) {
      setMessage(t("error.noToken"));
      setSaving(false);
      return;
    }
    // 后端 PATCH 是顶层 key 合并，这里直接把整个 prefs 扁平覆盖掉前端展示的字段
    const body = {
      bio: prefs.bio,
      tagline: prefs.tagline,
      links: prefs.links.filter((l) => l.label && l.url),
      projects: prefs.projects.filter((p) => p.title),
      // 有 itemKey 或有 title 的条目保留，至少得有一个标识符
      pinned_papers: prefs.pinned_papers.filter((p) => p.itemKey || p.title),
    };
    try {
      const res = await fetch("/api/user-center/preferences", {
        method: "PATCH",
        headers: {
          satoken: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMessage(t("error.http", { status: res.status }));
      } else {
        setMessage(t("status.saved"));
        setTimeout(() => {
          // 跳回自己的个人主页，用 githubId 作为 canonical URL
          const id = user?.githubId ?? user?.username;
          if (id) router.push(`/u/${id}`);
        }, 600);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("error.unknown"));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return <p className="font-mono text-sm text-neutral-500">{t("loading")}</p>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="border border-[var(--foreground)] p-8">
        <p className="font-mono text-sm mb-4">{t("auth.required")}</p>
        <Link
          href="/login"
          className="inline-block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="border border-[var(--foreground)] p-8">
        <p className="font-mono text-sm">
          {t("auth.notYours", { id: targetIdentifier })}
        </p>
        <Link
          href={`/u/${user?.githubId ?? user?.username}`}
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest hover:text-[#CC0000]"
        >
          {t("auth.goMine")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      {/* 编辑页顶部总说明：告诉用户这个页面都干什么 */}
      <div className="border border-[var(--foreground)] bg-[var(--background)] p-6 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
          {t("intro.label")}
        </div>
        <p>
          {t("intro.body", {
            id: String(user?.githubId ?? user?.username ?? "-"),
          })}
        </p>
      </div>

      {/* Section 1: 基础 */}
      <Section
        title={t("sec1.title")}
        heading={t("sec1.heading")}
        description={t("sec1.description")}
      >
        <Field label={t("sec1.tagline.label")}>
          <input
            type="text"
            value={prefs.tagline}
            onChange={(e) => setPrefs({ ...prefs, tagline: e.target.value })}
            maxLength={80}
            placeholder={t("sec1.tagline.placeholder")}
            className="w-full border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-sm"
          />
        </Field>
        <Field label={t("sec1.bio.label")}>
          <textarea
            value={prefs.bio}
            onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
            rows={4}
            maxLength={500}
            placeholder={t("sec1.bio.placeholder")}
            className="w-full border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm leading-relaxed resize-y"
          />
        </Field>
      </Section>

      {/* Section 2: Links */}
      <Section
        title={t("sec2.title")}
        heading={t("sec2.heading")}
        description={t("sec2.description")}
      >
        <RepeatableList
          items={prefs.links}
          onChange={(items) => setPrefs({ ...prefs, links: items })}
          empty={{ label: "", url: "" }}
          maxItems={5}
          addLabel={t("section.add")}
          removeLabel={t("section.remove")}
          render={(item, idx, update) => (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
              <input
                type="text"
                value={item.label}
                onChange={(e) => update({ ...item, label: e.target.value })}
                placeholder={t("sec2.label.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs uppercase"
              />
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder={t("sec2.url.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
            </div>
          )}
        />
      </Section>

      {/* Section 3: Projects */}
      <Section
        title={t("sec3.title")}
        heading={t("sec3.heading")}
        description={t("sec3.description")}
      >
        <RepeatableList
          items={prefs.projects}
          onChange={(items) => setPrefs({ ...prefs, projects: items })}
          empty={{ title: "", description: "", url: "", tags: [] }}
          maxItems={8}
          addLabel={t("section.add")}
          removeLabel={t("section.remove")}
          render={(item, idx, update) => (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => update({ ...item, title: e.target.value })}
                placeholder={t("sec3.titleField.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm font-bold"
              />
              <textarea
                value={item.description}
                onChange={(e) =>
                  update({ ...item, description: e.target.value })
                }
                rows={2}
                placeholder={t("sec3.desc.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-sans text-xs resize-y"
              />
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder={t("sec3.url.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
              <input
                type="text"
                value={item.tags.join(", ")}
                onChange={(e) =>
                  update({
                    ...item,
                    tags: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={t("sec3.tags.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
            </div>
          )}
        />
      </Section>

      {/* Section 4: Papers */}
      <Section
        title={t("sec4.title")}
        heading={t("sec4.heading")}
        description={t("sec4.description")}
      >
        <RepeatableList
          items={prefs.pinned_papers}
          onChange={(items) => setPrefs({ ...prefs, pinned_papers: items })}
          empty={{
            itemKey: "",
            title: "",
            authors: "",
            year: "",
            url: "",
            abstract: "",
          }}
          maxItems={8}
          addLabel={t("section.add")}
          removeLabel={t("section.remove")}
          render={(item, idx, update) => (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={item.itemKey}
                onChange={(e) => update({ ...item, itemKey: e.target.value })}
                placeholder={t("sec4.itemKey.placeholder")}
                className="border border-dashed border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs uppercase tracking-wider"
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => update({ ...item, title: e.target.value })}
                placeholder={t("sec4.titleField.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-serif text-sm font-bold"
              />
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                <input
                  type="text"
                  value={item.authors}
                  onChange={(e) => update({ ...item, authors: e.target.value })}
                  placeholder={t("sec4.authors.placeholder")}
                  className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
                />
                <input
                  type="text"
                  value={item.year}
                  onChange={(e) => update({ ...item, year: e.target.value })}
                  placeholder={t("sec4.year.placeholder")}
                  className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
                />
              </div>
              <input
                type="url"
                value={item.url}
                onChange={(e) => update({ ...item, url: e.target.value })}
                placeholder={t("sec4.url.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              />
              <textarea
                value={item.abstract}
                onChange={(e) => update({ ...item, abstract: e.target.value })}
                rows={2}
                placeholder={t("sec4.abstract.placeholder")}
                className="border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 font-sans text-xs resize-y"
              />
            </div>
          )}
        />
      </Section>

      {/* 提交 */}
      <div className="flex items-center gap-4 border-t-2 border-[var(--foreground)] pt-6">
        <button
          type="submit"
          disabled={saving}
          className="font-mono text-xs uppercase tracking-widest px-6 py-3 border-2 border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors disabled:opacity-50"
        >
          {saving ? t("cta.saving") : t("cta.save")}
        </button>
        <Link
          href={`/u/${user?.githubId ?? user?.username}`}
          className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-[var(--foreground)]"
        >
          {t("cta.cancel")}
        </Link>
        {message && (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  heading,
  description,
  children,
}: {
  /** 左上角的 SEC 编号，全大写英文 */
  title: string;
  /** 大号中文标题，让用户一眼知道这是什么 */
  heading: string;
  /** 一两句话解释这块填什么、填了之后主页哪里会显示 */
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--foreground)] p-6 lg:p-8 flex flex-col gap-4">
      <header className="border-b border-[var(--foreground)] pb-3 flex flex-col gap-1">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {title}
        </div>
        <h2 className="font-serif text-xl font-black text-[var(--foreground)]">
          {heading}
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * 通用可增删列表（links / projects / papers 共用）。
 * 用泛型保证 items 和 empty / render 类型一致。
 */
function RepeatableList<T>({
  items,
  onChange,
  empty,
  maxItems,
  addLabel,
  removeLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  maxItems: number;
  /** 翻译后的"+ 新增" / "+ Add"，由调用方传入保证 locale 一致 */
  addLabel: string;
  /** 翻译后的"删除此项" / "Remove"，由调用方传入 */
  removeLabel: string;
  render: (
    item: T,
    index: number,
    update: (next: T) => void,
  ) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="border border-dashed border-[var(--foreground)] p-4 flex flex-col gap-3"
        >
          {render(item, idx, (next) => {
            const copy = [...items];
            copy[idx] = next;
            onChange(copy);
          })}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            className="self-end font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-[#CC0000]"
          >
            {removeLabel}
          </button>
        </div>
      ))}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={() => onChange([...items, empty])}
          className="self-start font-mono text-[10px] uppercase tracking-widest px-3 py-1 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
