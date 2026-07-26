import { describe, expect, it } from "vitest";
import enMessages from "../messages/en.json";
import zhMessages from "../messages/zh.json";
import { resolveErrorKey } from "../app/components/LoginErrorNotice";

// 后端 OAuthController 实际会重定向的全部 error code。新增 code 时两边一起加，
// 否则用户只会看到通用的"请重试"（对 oauth_provider 这类重试无用的错误是误导）。
const BACKEND_ERROR_CODES = [
  "discord_canary",
  "oauth_failed",
  "oauth_state",
  "oauth_provider",
];

describe("resolveErrorKey", () => {
  it("没有 error 参数时不显示提示", () => {
    expect(resolveErrorKey(null)).toBeNull();
    expect(resolveErrorKey("")).toBeNull();
  });

  it("后端每个 error code 都有专属文案，不塌缩成通用提示", () => {
    for (const code of BACKEND_ERROR_CODES) {
      const key = resolveErrorKey(code);
      expect(key, `${code} 应有映射`).not.toBeNull();
      if (code !== "oauth_failed") {
        expect(key, `${code} 不该塌缩成通用文案`).not.toBe("errorGeneric");
      }
    }
  });

  // 回归：直接用 error 索引对象会命中原型链，?error=__proto__ 取到 Object.prototype
  // （非 undefined，?? 兜底不触发），渲染非字符串会让整个登录页崩掉。
  it("原型链上的键不会逃逸，一律落到通用文案", () => {
    for (const key of [
      "__proto__",
      "constructor",
      "toString",
      "valueOf",
      "hasOwnProperty",
    ]) {
      expect(resolveErrorKey(key), `${key} 必须被兜住`).toBe("errorGeneric");
    }
  });

  it("未知 code 落到通用文案", () => {
    expect(resolveErrorKey("wat")).toBe("errorGeneric");
  });

  it("解析出的 key 在 zh/en 里都存在", () => {
    for (const code of [...BACKEND_ERROR_CODES, "__proto__", "wat"]) {
      const key = resolveErrorKey(code)!;
      expect(zhMessages.login, `zh 缺 ${key}`).toHaveProperty(key);
      expect(enMessages.login, `en 缺 ${key}`).toHaveProperty(key);
    }
  });
});
