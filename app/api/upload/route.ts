import { NextRequest, NextResponse } from "next/server";
import type { UserView } from "@/lib/use-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sanitizeDocumentSlug, sanitizeResourceKey } from "@/lib/sanitizer";

/**
 * R2 配置
 * Cloudflare R2 兼容 S3 API，使用 AWS SDK 连接
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface UploadRequest {
  filename: string;
  contentType: string;
  articleSlug: string;
  /**
   * 必填：客户端上传前本地读取到的文件字节数（File.size）。
   * 服务端会：
   *   1. 立刻 reject 超过 MAX_UPLOAD_BYTES 的请求（省得签名）
   *   2. 把 Content-Length 绑进预签名 URL，让 R2 在上传时 enforce 大小上限
   * 客户端上传时必须带匹配的 Content-Length header，否则 R2 拒签。
   *
   * 为什么必填：如果 optional，直接打 /api/upload 不带 fileSize 会让服务端
   * 签出一张没有 ContentLength 约束的 URL，10MB 上限就成了摆设（客户端可上传 GB 级文件）。
   */
  fileSize: number;
}

/**
 * 服务端硬上限：单次上传 10 MB。
 * 注意：因为 R2 走预签名 URL，真正的拦截必须发生在签名阶段（把 ContentLength 绑进 URL），
 * 不能只在 /api/upload 这里做本地 byte check——这里根本看不到后续的 PUT 流量。
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * 从完整的 Content-Type header 值里抽出主 MIME（小写、去空白、丢掉所有参数）。
 *
 * 为什么需要：类似 `"image/jpeg; image/svg+xml"` 或 `"image/jpeg; charset=utf-8"`
 * 这种带参数的值，用 `startsWith("image/")` 校验会过、用 `startsWith("image/svg")`
 * 拒 SVG 的黑名单又绕得掉（前缀是 `image/jpeg;`），然后原始字符串塞进 R2 的
 * ContentType 再原样回吐给浏览器，触发 MIME sniffing 把 SVG payload 执行起来。
 * 所以 SVG 黑名单匹配 + 塞给 R2 的值都必须先收敛到分号前的主 MIME。
 */
function extractPrimaryMime(contentType: string): string {
  return contentType.split(";")[0]!.trim().toLowerCase();
}

/**
 * 严格 MIME 形状：`type/subtype`，两侧只允许 [a-z0-9.+-]，首字符必须是 [a-z0-9]。
 *
 * 用途：拒绝 CR/LF 及其他控制字符，防止注入被 SDK/R2/浏览器当成多个 header。
 * 虽然下游（AWS SDK / R2 / 浏览器）per RFC 7230 也会拒 header 值里的 CR/LF，
 * 但入口先收口更便宜也更正确，别依赖下游任何一层。
 */
const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

/**
 * @description POST /api/upload - 生成 R2 预签名 URL，用于客户端直接上传图片
 * @param request - NextRequest 对象，请求体包含以下字段：
 *   - filename: 文件名
 *   - contentType: 文件 MIME 类型
 *   - articleSlug: 文章 slug（用于组织文件路径）
 * @returns NextResponse - 返回 JSON 对象：
 *   - uploadUrl: 预签名上传 URL（用于 PUT 请求）
 *   - publicUrl: 图片的公开访问 URL
 *   - key: R2 对象键
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求头读取 x-satoken（客户端侧统一约定），转发后端时改为 satoken
    const token = request.headers.get("x-satoken");
    if (!token) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 调用后端 /auth/me 验证 token（服务端直连后端，走 BACKEND_URL 环境变量）
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    const meRes = await fetch(`${backendUrl}/auth/me`, {
      headers: { satoken: token },
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    const meBody = (await meRes.json()) as { data: UserView };
    const currentUser = meBody.data;

    // 验证环境变量
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !process.env.R2_PUBLIC_URL
    ) {
      console.error("R2 环境变量未配置");
      return NextResponse.json(
        { error: "服务器配置错误：R2 未配置" },
        { status: 500 },
      );
    }

    // 解析请求体
    const body = (await request.json()) as UploadRequest;
    const { filename, contentType, articleSlug, fileSize } = body;

    // 验证请求参数
    if (!filename || !contentType || !articleSlug) {
      return NextResponse.json(
        { error: "缺少必要参数：filename, contentType, articleSlug" },
        { status: 400 },
      );
    }

    // 验证 fileSize 必填 + 合法（必须在签名前完成，否则 ContentLength 绑不进 URL，10MB 上限等于没有）
    if (typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "缺少必要参数：fileSize（必须是 number）" },
        { status: 400 },
      );
    }
    // Content-Length 必须是非负整数。用 isSafeInteger 直接拒 NaN / Infinity / 小数
    // （原来用 isFinite 会放 10.5 之类过去，然后 R2 在 PUT 时才 reject，变成用户看来
    // 的静默失败）；同时 isSafeInteger 隐含了上界（<=2^53-1），不会被过大的 number 溢出。
    if (!Number.isSafeInteger(fileSize) || fileSize < 0) {
      return NextResponse.json({ error: "fileSize 参数无效" }, { status: 400 });
    }
    if (fileSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `文件过大：最大允许 ${MAX_UPLOAD_BYTES} 字节（10 MB）`,
        },
        { status: 413 },
      );
    }

    // 验证文件类型：
    // 1. 必须是 image/*
    // 2. 显式 block image/svg+xml —— SVG 可以内嵌 <script>，即使走 R2 公开 URL 也会在浏览器里执行 JS，
    //    构成存储型 XSS 向量。我们宁可让用户转成 PNG/JPG 也不放行。
    // 注意：所有判断都走 primaryMime（分号前的主 MIME），绕不过 `"image/jpeg; image/svg+xml"` 这种夹带。
    const primaryMime = extractPrimaryMime(contentType);
    // 拒绝 CR/LF 及其他控制字符，防止注入被 SDK/R2/浏览器当成多个 header
    if (!MIME_PATTERN.test(primaryMime)) {
      return NextResponse.json(
        { error: "contentType 格式非法" },
        { status: 400 },
      );
    }
    if (!primaryMime.startsWith("image/")) {
      return NextResponse.json(
        { error: "仅支持图片类型文件" },
        { status: 400 },
      );
    }
    if (
      primaryMime === "image/svg+xml" ||
      primaryMime.startsWith("image/svg")
    ) {
      return NextResponse.json(
        { error: "出于安全原因，不接受 SVG 文件（可能包含可执行脚本）" },
        { status: 400 },
      );
    }

    // 生成唯一的对象键
    // 格式：users/{userId}/{article-slug}/{timestamp}-{filename}
    const timestamp = Date.now();
    const userId = String(currentUser.id);
    const sanitizedSlug = sanitizeDocumentSlug(articleSlug);
    const sanitizedFilename = sanitizeResourceKey(filename);
    const key = `users/${userId}/${sanitizedSlug}/${timestamp}-${sanitizedFilename}`;

    // 创建 PutObject 命令
    // - ContentType 用 primaryMime —— 不能把原始 contentType 原样塞进 R2 对象元数据，
    //   否则 `"image/jpeg; image/svg+xml"` 之类的分号夹带会跟着落库，R2 回吐给浏览器时
    //   触发 MIME sniffing。
    // - ContentLength 强绑 fileSize —— 上传时客户端必须发送匹配的 Content-Length header，
    //   R2 会 enforce，超过或少于这个数字的 PUT 一律被 R2 拒绝。
    //   这是预签名 URL 唯一能做服务端大小限制的机制，所以 fileSize 必须必填。
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: primaryMime,
      ContentLength: fileSize,
    });

    // 生成预签名 URL（15 分钟有效期）
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 900,
    });

    // 生成公开访问 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("生成预签名 URL 失败:", error);
    return NextResponse.json(
      {
        error: "生成上传链接失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
