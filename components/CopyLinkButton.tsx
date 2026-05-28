"use client";

import { useState, useTransition } from "react";

export function CopyLinkButton({
  url,
  label = "复制分享链接",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const doCopy = () => {
    const fallback = () => {
      try {
        window.prompt("请手动复制分享链接", url);
      } catch {
        /* ignore */
      }
    };
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      fallback();
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        startTransition(() => {
          setTimeout(() => setCopied(false), 3000);
        });
      },
      () => fallback()
    );
  };

  return (
    <button
      type="button"
      onClick={doCopy}
      className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]"
    >
      {copied ? "已复制" : label}
    </button>
  );
}
