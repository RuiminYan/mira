"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE = "mira.consent";

function setCookie(value: string) {
  const max = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${max}; samesite=lax`;
}
function getCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)mira\.consent=([^;]+)/);
  return m?.[1] ?? null;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const v = getCookie();
    if (!v) {
      const id = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(id);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 px-3 pointer-events-none">
      <div className="mx-auto max-w-3xl rounded-[12px] border border-line-2 bg-bg/95 backdrop-blur-xl shadow-2xl px-4 py-3.5 pointer-events-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 text-[13px] leading-6 text-ink-2">
            我们使用必要 Cookie 维持登录与语言偏好,不投放跨站广告。详情见{" "}
            <Link href="/privacy" className="text-ink hover:underline">
              隐私政策
            </Link>{" "}
            与{" "}
            <Link href="/terms" className="text-ink hover:underline">
              服务协议
            </Link>
            。
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => {
                setCookie("essential");
                setShow(false);
              }}
              className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink-3 hover:text-ink hover:border-line-2"
            >
              仅必要
            </button>
            <Link
              href="/privacy"
              className="rounded-md border border-line px-3 py-1.5 text-[12.5px] text-ink-3 hover:text-ink hover:border-line-2"
            >
              设置
            </Link>
            <button
              onClick={() => {
                setCookie("all");
                setShow(false);
              }}
              className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
            >
              全部接受
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
