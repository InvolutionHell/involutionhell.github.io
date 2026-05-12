/**
 * URL scheme 白名单工具——拦截 javascript: / data: / vbscript: 等 XSS 向量。
 *
 * 两个主要入口：
 *   - sanitizeExternalUrl: 给 <a href> 用，允许 http/https/mailto + 站内相对路径
 *   - sanitizeMediaUrl:   给 <img src> / <video src> / <iframe src> 用，
 *                         只允许 http/https（mailto 放进来没意义）
 *
 * 任何从后端 / 用户偏好 / 管理员输入来的 URL 在渲染前都必须过这里。
 * 从最早 /u/[username]/page.tsx 的本地实现抽出来共享，events 页 / profile
 * 页复用同一套白名单逻辑，避免各自再写一份容易漏项。
 */

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);

function sanitize(
  raw: string | undefined | null,
  allowed: Set<string>,
  allowRelative: boolean,
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // 相对路径（/foo/bar）放行；但屏蔽协议相对 URL (//evil.com/x)，
  // 那种会继承当前页 scheme 去找攻击者域名
  if (allowRelative && trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed);
    return allowed.has(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * 链接（<a href>）场景：允许 http(s) / mailto / 站内相对路径。
 * 不合法返回 null，调用方应当渲染成纯文本（不要加 <a>）。
 */
export function sanitizeExternalUrl(
  raw: string | undefined | null,
): string | null {
  return sanitize(raw, SAFE_LINK_PROTOCOLS, true);
}

/**
 * 媒体（<img src> / <video src> / <iframe src>）场景：只允许 http(s)。
 * mailto 无意义；data: 虽然对 <img> 较常用但体积和审计风险高，默认不放；
 * 站内相对路径允许（/logo.png、/event/cover.webp 这些）。
 *
 * 自动 http -> https 升级：后端 OgFetchService 已在抓取阶段做一次升级，
 * 这里是 defense-in-depth —— 万一某条历史数据漏网（或 LLM 兜底回填了
 * http:// 的封面），前端再升一次。HTTPS 页面加载 http:// 图片会被
 * mixed-content policy 拦掉，宁可不显示也别让浏览器报黄锁。
 *
 * 实现历史：最初版本用字符串拼接 `"https://" + safe.substring(7)`，被 CR
 * (#345) 指出会保留显式端口 —— `http://x.com:80/` 升成 `https://x.com:80/`
 * 后浏览器拿 80 端口走 TLS 必失败。改成走 URL 对象重写 protocol，
 * 并在 port === "80" 时清空端口（http 默认端口在 https 里没意义）。
 */
export function sanitizeMediaUrl(
  raw: string | undefined | null,
): string | null {
  const safe = sanitize(raw, SAFE_MEDIA_PROTOCOLS, true);
  if (!safe) return null;
  // 相对路径（"/x.jpg"）走不到协议升级，原样返回
  if (!safe.toLowerCase().startsWith("http://")) return safe;
  try {
    const u = new URL(safe);
    u.protocol = "https:";
    // 显式 :80 在 https 下会让浏览器拿 80 端口握手 TLS，必挂；清空让它走默认 443
    if (u.port === "80") u.port = "";
    return u.toString();
  } catch {
    // 理论上 sanitize 已经保证 URL 合法可解析，走到这只是兜底
    return safe;
  }
}
