/**
 * url-safety 单元测试（CR PR#345 要求补的覆盖）。
 *
 * sanitizeMediaUrl 现在做两件事：
 *   1. 协议白名单：只放 http/https + 站内相对路径，拒 javascript:/data:/协议相对
 *   2. http -> https 自动升级，顺手清显式 :80（http 默认端口在 https 下会挂 TLS）
 *
 * sanitizeExternalUrl 走的是 link 白名单（多个 mailto:），不在本次 PR 改动范围，
 * 但顺手补几条 smoke test 锁住边界。
 */
import { describe, expect, test } from "vitest";
import { sanitizeMediaUrl, sanitizeExternalUrl } from "../lib/url-safety";

describe("sanitizeMediaUrl", () => {
  test("https 原样返回（normalizer 可能加 trailing slash，URL.toString 已稳定）", () => {
    expect(sanitizeMediaUrl("https://example.com/x.jpg")).toBe(
      "https://example.com/x.jpg",
    );
  });

  test("http:// 自动升级到 https://", () => {
    expect(sanitizeMediaUrl("http://example.com/x.jpg")).toBe(
      "https://example.com/x.jpg",
    );
  });

  test("HTTP:// 大小写不敏感升级", () => {
    expect(sanitizeMediaUrl("HTTP://example.com/x.jpg")).toBe(
      "https://example.com/x.jpg",
    );
  });

  test("显式 :80 端口在升级时清空（防止 https 拿 80 走 TLS）", () => {
    expect(sanitizeMediaUrl("http://example.com:80/x.jpg")).toBe(
      "https://example.com/x.jpg",
    );
  });

  test("非 80 的显式端口保留（用户可能跑了 https on 8443 这种）", () => {
    expect(sanitizeMediaUrl("http://example.com:8080/x.jpg")).toBe(
      "https://example.com:8080/x.jpg",
    );
  });

  test("升级保留 path / query / hash", () => {
    expect(
      sanitizeMediaUrl(
        "http://mmbiz.qpic.cn/sz_mmbiz_jpg/abc/0?wx_fmt=jpeg&tp=webp#x",
      ),
    ).toBe("https://mmbiz.qpic.cn/sz_mmbiz_jpg/abc/0?wx_fmt=jpeg&tp=webp#x");
  });

  test("站内相对路径原样返回，不走 URL parser", () => {
    expect(sanitizeMediaUrl("/logo.png")).toBe("/logo.png");
    expect(sanitizeMediaUrl("/event/cover.webp?v=1")).toBe(
      "/event/cover.webp?v=1",
    );
  });

  test("协议相对 URL 被拒（//evil.com 会继承当前页协议跳到攻击者域）", () => {
    expect(sanitizeMediaUrl("//evil.com/x.jpg")).toBeNull();
  });

  test("javascript: / data: / vbscript: 被拒", () => {
    expect(sanitizeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeMediaUrl("data:image/png;base64,AAA")).toBeNull();
    expect(sanitizeMediaUrl("vbscript:msgbox(1)")).toBeNull();
  });

  test("mailto: 在媒体场景被拒（不在 SAFE_MEDIA_PROTOCOLS）", () => {
    expect(sanitizeMediaUrl("mailto:a@b.com")).toBeNull();
  });

  test("空 / null / undefined / 仅空白 → null", () => {
    expect(sanitizeMediaUrl(null)).toBeNull();
    expect(sanitizeMediaUrl(undefined)).toBeNull();
    expect(sanitizeMediaUrl("")).toBeNull();
    expect(sanitizeMediaUrl("   ")).toBeNull();
  });

  test("升级行为幂等：已是 https 不改", () => {
    const out1 = sanitizeMediaUrl("https://example.com/x.jpg");
    const out2 = sanitizeMediaUrl(out1!);
    expect(out2).toBe(out1);
  });
});

describe("sanitizeExternalUrl", () => {
  test("mailto 允许（媒体场景拒、链接场景允许，区分两个白名单）", () => {
    expect(sanitizeExternalUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
  });

  test("协议相对 URL 被拒（同 media）", () => {
    expect(sanitizeExternalUrl("//evil.com/x")).toBeNull();
  });

  test("站内相对路径原样返回", () => {
    expect(sanitizeExternalUrl("/about")).toBe("/about");
  });
});
