"use client";
import { useEffect } from "react";

/**
 * Mounts a CSS class on the <html> element while this component is mounted.
 * Useful for route-scoped global style toggles.
 */
export function HtmlClassOnMount({ className }: { className: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(className);
    return () => {
      root.classList.remove(className);
    };
  }, [className]);

  return null;
}

/** Shortcut for docs route flag */
export function DocsRouteFlag() {
  return <HtmlClassOnMount className="docs-route" />;
}
