"use client";

/**
 * Admin 侧的活动表单（新建 + 编辑共用）。
 *
 * 表单字段基本是 EventRequest 的直接映射。
 * 几个 UX 细节：
 * - startTime / endTime 用 <input type="datetime-local">，提交前转成 ISO
 * - speakers 简化成"每行一条 name"，头像/profile URL 暂不支持（延后）
 * - tags 用"逗号分隔"单行输入
 * - cover_url / discord / playback 都是可选
 * - 提交后跳 /admin/events 列表
 */

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  EventRequest,
  EventView,
  EventStatus,
} from "@/app/[locale]/events/types";
import { createEvent, updateEvent } from "./lib";

interface Props {
  /** undefined 表示新建；传入 EventView 表示编辑 */
  initial?: EventView;
}

const STATUS_OPTIONS: EventStatus[] = [
  "draft",
  "published",
  "archived",
  "cancelled",
];

export function EventForm({ initial }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const req: EventRequest = {
      title: String(fd.get("title") ?? "").trim(),
      description: String(fd.get("description") ?? ""),
      coverUrl: emptyToNull(fd.get("coverUrl")),
      startTime: datetimeLocalToIso(fd.get("startTime")),
      endTime: datetimeLocalToIso(fd.get("endTime")),
      discordLink: emptyToNull(fd.get("discordLink")),
      playbackUrl: emptyToNull(fd.get("playbackUrl")),
      tags: splitCsv(fd.get("tags")),
      speakers: parseSpeakers(fd.get("speakers")),
      status: (fd.get("status") as EventStatus) ?? "draft",
    };

    // endTime > startTime 客户端校验（issue #302 P2-1）。
    // 后端有相同校验作为权威，前端这层是防止管理员在 UI 上明显手抖。
    // 两个 ISO 字符串字典序与时间序一致，可以直接 string compare。
    if (req.startTime && req.endTime && req.endTime <= req.startTime) {
      setError("结束时间必须晚于开始时间");
      setSubmitting(false);
      return;
    }

    try {
      if (initial) {
        await updateEvent(initial.id, req);
      } else {
        await createEvent(req);
      }
      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-6 max-w-3xl"
    >
      <Field
        label="标题"
        name="title"
        required
        defaultValue={initial?.title ?? ""}
      />
      <Field
        label="描述"
        name="description"
        multiline
        rows={6}
        defaultValue={initial?.description ?? ""}
        hint="支持普通文本，段落用空行分隔。"
      />
      <Field
        label="封面 URL"
        name="coverUrl"
        defaultValue={initial?.coverUrl ?? ""}
        hint="建议 16:9，/event/ 目录下的 webp 最佳。也支持外链。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="开始时间"
          name="startTime"
          type="datetime-local"
          defaultValue={isoToDatetimeLocal(initial?.startTime)}
        />
        <Field
          label="结束时间"
          name="endTime"
          type="datetime-local"
          defaultValue={isoToDatetimeLocal(initial?.endTime)}
        />
      </div>

      <Field
        label="Discord 链接"
        name="discordLink"
        defaultValue={initial?.discordLink ?? ""}
        hint="活动当天的 Discord 入口（频道 / Scheduled Event URL）。"
      />
      <Field
        label="回放链接"
        name="playbackUrl"
        defaultValue={initial?.playbackUrl ?? ""}
        hint="YouTube / 站内 /docs 文章 / Drive 链接均可；YouTube 会被内嵌到详情页。"
      />

      <Field
        label="Tags (逗号分隔)"
        name="tags"
        defaultValue={initial?.tags?.join(", ") ?? ""}
        hint="如：career, interview, mock。目前只做展示，未来会支持按 tag 筛选。"
      />

      <Field
        label="Speakers (每行一条)"
        name="speakers"
        multiline
        rows={4}
        defaultValue={initial?.speakers?.map((s) => s.name).join("\n") ?? ""}
        hint="目前只记录姓名；头像 / profile URL 后续版本支持。"
      />

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          状态
        </label>
        <select
          name="status"
          defaultValue={initial?.status ?? "draft"}
          className="border border-[var(--foreground)] px-3 py-2 bg-[var(--background)] text-[var(--foreground)] font-mono text-xs uppercase"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          draft = 仅管理员可见；published = 公开；archived = 历史；cancelled =
          取消。
        </p>
      </div>

      {error && (
        <div className="border border-[#CC0000] p-3 text-sm text-[#CC0000] font-mono">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="font-mono text-xs uppercase tracking-widest px-5 py-2 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[#CC0000] hover:border-[#CC0000] transition-colors disabled:opacity-50"
        >
          {submitting ? "保存中…" : initial ? "保存修改" : "创建活动"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/events")}
          className="font-mono text-xs uppercase tracking-widest px-5 py-2 border border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  multiline,
  rows,
  hint,
}: FieldProps) {
  const base =
    "border border-[var(--foreground)] px-3 py-2 bg-[var(--background)] text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[#CC0000]";
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
      >
        {label} {required && <span className="text-[#CC0000]">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          required={required}
          rows={rows ?? 4}
          defaultValue={defaultValue}
          className={`${base} resize-y`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className={base}
        />
      )}
      {hint && (
        <p className="text-[11px] text-neutral-500 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function splitCsv(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** 每行一个 speaker 名字 → [{name}] */
function parseSpeakers(v: FormDataEntryValue | null) {
  if (!v) return [];
  return String(v)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/** <input type="datetime-local"> 的 value 是 "YYYY-MM-DDTHH:mm" 本地时间，无时区；
 *  转成 UTC ISO 字符串再给后端。空值返回 null。 */
function datetimeLocalToIso(v: FormDataEntryValue | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // new Date("YYYY-MM-DDTHH:mm") 浏览器按本地时区解析
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ISO 字符串 → datetime-local 输入值。未设置时返回 "". */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local 需要 YYYY-MM-DDTHH:mm（无秒无时区）
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
