/**
 * top-docs（热门文档榜）后端返回的 path 是无 locale 的 canonical（形如 /docs/learn/ai）。
 * 拼上当前 locale 前缀得到可点击 URL。
 *
 * 防御性归一化：剥掉可能残留的 content/ 前缀和多余前导斜杠，避免后端某次回退到
 * 旧格式（content/docs/...）时前端直接拼出 /en/content/docs/... 死链。
 */
export function topDocHref(locale: string, path: string): string {
  const clean = "/" + path.replace(/^\/+/, "").replace(/^content\//, "");
  return `/${locale}${clean}`;
}
