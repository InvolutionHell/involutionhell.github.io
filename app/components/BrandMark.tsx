/**
 * 品牌标志组件
 * 用于显示品牌名称和图标
 * @author longsihzhuo
 * @date 2025-10-14
 * @version 1.0.0
 * @description 品牌标志组件
 * @param {string} className - 类名
 * @param {string} textClassName - 文本类名
 * @param {string} imageClassName - 图片类名
 * @param {number} imageSize - 图片大小
 * @param {boolean} priority - 是否优先加载
 */
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_NAME = "Involution Hell";
export const BRAND_LOGO_LIGHT_SRC = "/logo/logoInLight.svg";
export const BRAND_LOGO_DARK_SRC = "/logo/logoInDark.svg";
export const BRAND_LOGO_ALT = "Involution Hell 品牌标志";
const BRAND_LOGO_ASPECT_RATIO = 283.17334 / 160.50055;

type BrandMarkProps = {
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  imageSize?: number;
  priority?: boolean;
};

export function BrandMark({
  className,
  textClassName,
  imageClassName,
  imageSize = 32,
  priority = false,
}: BrandMarkProps) {
  const width = Math.round(imageSize * BRAND_LOGO_ASPECT_RATIO);

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Image
          src={BRAND_LOGO_LIGHT_SRC}
          alt={BRAND_LOGO_ALT}
          width={width}
          height={imageSize}
          priority={priority}
          className={cn("object-contain dark:hidden", imageClassName)}
        />
        <Image
          src={BRAND_LOGO_DARK_SRC}
          alt={BRAND_LOGO_ALT}
          width={width}
          height={imageSize}
          priority={priority}
          className={cn("hidden dark:block object-contain", imageClassName)}
        />
      </div>
      <span
        className={cn(
          "font-serif font-black text-2xl tracking-tighter uppercase italic",
          textClassName,
        )}
      >
        {BRAND_NAME}
      </span>
    </Link>
  );
}
