// import Image from "next/image";
import type { ImageProps } from "next/image";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";

type MdxImageProps = ComponentPropsWithoutRef<"img"> & {
  src?: ImageProps["src"];
  width?: number | string;
  height?: number | string;
};

function MdxImage({ src, alt = "", width, height, ...rest }: MdxImageProps) {
  // if (!src) {
  //   return (
  //     <img
  //       src={src as string}
  //       alt={alt}
  //       width={width}
  //       height={height}
  //       {...rest}
  //     />
  //   );
  // }
  // const numericWidth = typeof width === "string" ? Number(width) : width;
  // const numericHeight = typeof height === "string" ? Number(height) : height;

  // if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight)) {
  //   // fallback: 当 width/height 不是可解析数值时，直接使用原生 <img>
  //   return <img src={src ?? ""} alt={alt ?? ""} {...rest} />;
  // }

  // return (
  //   <Image
  //     src={src ?? ""}
  //     alt={alt ?? ""}
  //     width={numericWidth}
  //     height={numericHeight}
  //     {...rest}
  //   />
  // );
  return (
    <img
      src={src as string}
      alt={alt}
      width={width}
      height={height}
      {...rest}
    />
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    img: MdxImage,
    ...components,
  };
}
