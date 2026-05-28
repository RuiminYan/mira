"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") || "").trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 rounded-md border border-line bg-bg/95 px-3 py-1.5 text-[13px]"
        aria-label="打开全站搜索 (Ctrl/Cmd K)"
      >
        <SearchIcon size={14} className="inline mr-1" /> 搜索
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="全站搜索"
        >
          <div
            className="w-[92%] max-w-[560px] rounded-[14px] border border-line-2 bg-surface/95 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit} className="flex items-center gap-2">
              <SearchIcon size={16} className="text-ink-3" />
              <input
                ref={inputRef}
                name="q"
                type="search"
                placeholder="搜索人才 / 订单 / 通知 / 文档..."
                className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
                aria-label="关键词"
              />
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono text-ink-4">↵</kbd>
            </form>
            <div className="mt-3 text-[11.5px] text-ink-4">
              输入关键词回车跳转到搜索结果页。Esc 关闭。
            </div>
          </div>
        </div>
      )}
    </>
  );
}
