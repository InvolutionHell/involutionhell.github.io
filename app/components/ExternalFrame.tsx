import * as React from "react";

type Props = {
  src: string;
  title?: string;
  height?: number | string; // e.g. 480 or "70vh"
  className?: string;
  allowFullScreen?: boolean;
  sandbox?: string; // override if needed
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>["referrerPolicy"];
};

export function ExternalFrame({
  src,
  title = "Embedded Content",
  height = "70vh",
  className,
  allowFullScreen = true,
  sandbox,
  referrerPolicy = "no-referrer",
}: Props) {
  // Keep the API conservative by default; caller can override sandbox if needed.
  const sandboxAttrs =
    sandbox ?? "allow-scripts allow-popups allow-forms allow-presentation";

  return (
    <div className={className} style={{ width: "100%" }}>
      <iframe
        src={src}
        title={title}
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          border: 0,
        }}
        loading="lazy"
        referrerPolicy={referrerPolicy}
        sandbox={sandboxAttrs}
        allowFullScreen={allowFullScreen}
      />
    </div>
  );
}

export default ExternalFrame;
