// next.config.mjs
import { withContentlayer } from 'next-contentlayer'

export default withContentlayer()({
  reactStrictMode: true,
  output: 'export',         // 关键：静态导出到 /out
  images: { unoptimized: true }, // 避免使用 Next Image 优化服务
})
