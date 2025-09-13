import React from "react";

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverType?: "darken" | "scale" | "lift" | "glow";
}

export default function HoverCard({
  children,
  className = "",
  hoverType = "scale",
}: HoverCardProps) {
  const getHoverStyles = () => {
    switch (hoverType) {
      case "darken":
        return "hover:brightness-90 transition-all duration-200 ease-in-out";
      case "scale":
        return "hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out";
      case "lift":
        return "hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ease-in-out";
      case "glow":
        return "hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 ease-in-out";
      default:
        return "hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out";
    }
  };

  return <div className={`${getHoverStyles()} ${className}`}>{children}</div>;
}
