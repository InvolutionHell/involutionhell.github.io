"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  // On mount, check localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Toggle handler
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggle}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 100,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 24,
        color: isDark ? "#ededed" : "#171717",
        transition: "color 0.2s",
      }}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
