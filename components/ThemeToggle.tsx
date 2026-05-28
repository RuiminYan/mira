"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/components/ThemeNoFlashScript";

type Mode = "light" | "dark" | "auto";

function applyMode(mode: Mode) {
  const isDark =
    mode === "dark" ||
    (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "auto";
    setMode(stored);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "auto";
      if (current === "auto") applyMode("auto");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next: Mode = mode === "auto" ? "light" : mode === "light" ? "dark" : "auto";
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  }

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const label = mode === "dark" ? "深色" : mode === "light" ? "浅色" : "跟随系统";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`切换主题:当前${label}`}
      title={`主题:${label}`}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-white/[0.06] transition " +
        (mounted ? "" : "opacity-0 pointer-events-none ") +
        className
      }
    >
      <Icon size={16} />
    </button>
  );
}
