// next.config.mjs
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export", // 关键：静态导出到 /out
  images: { unoptimized: true }, // 避免使用 Next Image 优化服务
};

export default withMDX(config);
