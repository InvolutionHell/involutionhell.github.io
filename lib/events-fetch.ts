/**
 * 首屏活动数据获取（Server Component 用）。
 *
 * 做的事：
 * 1. 调后端 /api/events 拿 published + archived 列表
 * 2. 转成首页 ActivityTicker / FloatWindow 原本认识的老 schema
 *    （name / discord / playback / coverUrl / deprecated），组件渲染逻辑不大改
 *
 * 失败策略：
 *   前后端分离架构下，后端可用是硬前提。任何失败（BACKEND_URL 未配 / 网络异常 /
 *   非 2xx / JSON 解析错）都返回空数组，让 ActivityTicker 和 FloatWindow 渲染出空态
 *   或直接不出现，同时把异常打到 server log 供排查。不再维护 data/event.json 兜底。
 */

import type { EventView } from "@/app/[locale]/events/types";

/** Hero / FloatWindow 识别的字段结构 */
export interface HomepageEvent {
  id: number;
  name: string;
  discord: string;
  playback?: string;
  coverUrl: string;
  deprecated: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 把后端 EventView 映射成 HomepageEvent。
 * - discord: 优先 discordLink；没有时回落到站内详情页
 * - coverUrl: 后端可能为 null，用一张默认 placeholder
 * - deprecated: status=archived|cancelled 或已过 endTime
 */
function toHomepageEvent(ev: EventView): HomepageEvent {
  return {
    id: ev.id,
    name: ev.title,
    discord: ev.discordLink ?? `/events/${ev.id}`,
    playback: ev.playbackUrl ?? undefined,
    coverUrl: ev.coverUrl ?? "/event/coffeeChat.webp",
    deprecated:
      ev.past || ev.status === "archived" || ev.status === "cancelled",
  };
}

/**
 * 拿首页要用的活动列表。任何失败都返回空数组（记日志，不向外抛，避免首页 SSR 500）。
 */
export async function fetchHomepageEvents(): Promise<HomepageEvent[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.warn("[fetchHomepageEvents] BACKEND_URL 未配置，返回空列表");
    return [];
  }

  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      next: { revalidate: 300 },
      headers: {
        accept: "application/json",
        "user-agent": "InvolutionHell-SSR/1.0 (+https://involutionhell.com)",
      },
    });
    if (!res.ok) {
      console.warn(
        `[fetchHomepageEvents] 后端 ${res.status} ${res.statusText}`,
      );
      return [];
    }
    const json = (await res.json()) as ApiResponse<EventView[]>;
    if (!json.success || !json.data) {
      // success=false 或缺少 data 分支：以前直接 return [] 会丢掉排障信息，
      // 补一条 warn 携带 message / success / hasData，让 server log 能定位
      console.warn("[fetchHomepageEvents] 后端返回业务失败或数据缺失", {
        message: json.message,
        success: json.success,
        hasData: json.data !== undefined,
      });
      return [];
    }
    return (
      json.data
        .map(toHomepageEvent)
        // 未过期的活动排前面
        .sort((a, b) => Number(a.deprecated) - Number(b.deprecated))
    );
  } catch (err) {
    console.warn("[fetchHomepageEvents] 网络异常:", err);
    return [];
  }
}
