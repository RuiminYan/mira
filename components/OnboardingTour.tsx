"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type Step = { selector: string; title: string; body: string };

const ZH: Record<"creator" | "partner" | "mcn", Step[]> = {
  creator: [
    { selector: '[data-tour="creator-verify"]', title: "完成实名认证", body: "实名后系统会生成 KYC 授权合同并自动上链。" },
    { selector: '[data-tour="creator-talents"]', title: "上传你的形象", body: "照片、视频或 3D 扫描皆可,管理员审核后即上架。" },
    { selector: '[data-tour="creator-new"]', title: "配置授权规则", body: "定价、分账比例、独家与否,完全自主。" },
    { selector: '[data-tour="creator-analytics"]', title: "查看驾驶舱", body: "实时跟踪订单、分账与代扣明细。" },
    { selector: '[data-tour="creator-nfts"]', title: "查看你的 NFT", body: "每个形象在上架时会自动铸造一枚 NFT,可在链上转让。" },
  ],
  partner: [
    { selector: '[data-tour="talent-list"]', title: "浏览选角广场", body: "按性别、风格、价位筛选 AI 演员。" },
    { selector: '[data-tour="talent-detail"]', title: "议价 / 套餐", body: "对独家档期可在线议价,套餐适合大批量配角。" },
    { selector: '[data-tour="partner-orders"]', title: "下单", body: "下单后进入「待支付」,审核通过自动结算。" },
    { selector: '[data-tour="partner-pay"]', title: "支付", body: "微信 / 支付宝皆可,模拟环境秒到账。" },
    { selector: '[data-tour="partner-delivery"]', title: "查看交付包", body: "审核通过后,你会拿到带水印的素材交付包。" },
  ],
  mcn: [
    { selector: '[data-tour="mcn-creators"]', title: "查看旗下创作者", body: "签约的 KOC 会在这里集中管理。" },
    { selector: '[data-tour="mcn-commission"]', title: "抽成设置", body: "对每位创作者单独设置版税抽成。" },
    { selector: '[data-tour="mcn-revenue"]', title: "查看收益面板", body: "汇总所有签约 KOC 的分账与抽成。" },
  ],
};

const EN: Record<"creator" | "partner" | "mcn", Step[]> = {
  creator: [
    { selector: '[data-tour="creator-verify"]', title: "Complete KYC", body: "Once verified, a KYC license is hashed on-chain." },
    { selector: '[data-tour="creator-talents"]', title: "Upload your likeness", body: "Photos, video, or 3D scans. Live after admin review." },
    { selector: '[data-tour="creator-new"]', title: "Set royalty rules", body: "Pricing, share, exclusivity — your call." },
    { selector: '[data-tour="creator-analytics"]', title: "Open the dashboard", body: "Track orders, splits, withholdings in real time." },
    { selector: '[data-tour="creator-nfts"]', title: "See your NFTs", body: "Each face is minted on listing and can be transferred on-chain." },
  ],
  partner: [
    { selector: '[data-tour="talent-list"]', title: "Browse the plaza", body: "Filter AI actors by gender, style, and budget." },
    { selector: '[data-tour="talent-detail"]', title: "Negotiate or bundle", body: "Haggle for exclusives; bundles cover bulk extras." },
    { selector: '[data-tour="partner-orders"]', title: "Place an order", body: "Orders enter 'awaiting payment'." },
    { selector: '[data-tour="partner-pay"]', title: "Pay", body: "WeChat / Alipay; the demo settles instantly." },
    { selector: '[data-tour="partner-delivery"]', title: "Pick up delivery", body: "You will get a watermarked delivery package." },
  ],
  mcn: [
    { selector: '[data-tour="mcn-creators"]', title: "View signed creators", body: "All KOCs you signed appear here." },
    { selector: '[data-tour="mcn-commission"]', title: "Commissions", body: "Per-creator royalty cut." },
    { selector: '[data-tour="mcn-revenue"]', title: "Earnings panel", body: "Aggregated splits and agency commissions." },
  ],
};

export function OnboardingTour({
  role,
  locale,
}: {
  role: "creator" | "partner" | "admin" | "mcn";
  locale: "zh" | "en";
}) {
  const enabled = role === "creator" || role === "partner" || role === "mcn";
  const steps = useMemo<Step[]>(() => {
    if (!enabled) return [];
    const dict = locale === "en" ? EN : ZH;
    return dict[role as "creator" | "partner" | "mcn"] || [];
  }, [role, locale, enabled]);

  const key = `mira.tour.${role}`;
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(key);
    if (done === "1") return;
    // wait a beat for the page to render
    const id = window.setTimeout(() => setActive(true), 800);
    return () => window.clearTimeout(id);
  }, [enabled, key]);

  useEffect(() => {
    if (!active) return;
    if (steps.length === 0) {
      setActive(false);
      return;
    }
    function update() {
      const sel = steps[idx]?.selector;
      if (!sel) {
        setRect(null);
        return;
      }
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect(r);
    }
    update();
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [active, idx, steps]);

  if (!active || steps.length === 0) return null;
  const step = steps[idx]!;

  function close(persist = true) {
    if (persist && typeof window !== "undefined") {
      window.localStorage.setItem(key, "1");
    }
    setActive(false);
  }

  function next() {
    if (idx + 1 >= steps.length) {
      close(true);
    } else {
      setIdx((i) => i + 1);
    }
  }
  function prev() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  const labels =
    locale === "en"
      ? { skip: "Skip", next: "Next", prev: "Back", done: "Got it" }
      : { skip: "跳过", next: "下一步", prev: "上一步", done: "我知道了" };

  // bubble position based on rect; fallback center-screen
  let bubble: React.CSSProperties = {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: 340,
  };
  let spotlight: React.CSSProperties | null = null;
  if (rect && rect.width > 0) {
    const pad = 10;
    const x = rect.left - pad;
    const y = rect.top - pad;
    const w = rect.width + pad * 2;
    const h = rect.height + pad * 2;
    spotlight = {
      position: "fixed",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 14,
      pointerEvents: "none",
      boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
      border: "1.5px solid rgba(255,111,180,0.7)",
      transition: "all .25s ease",
    };
    const bubbleY = y + h + 16;
    const placeBelow = bubbleY + 180 < window.innerHeight;
    bubble = {
      position: "fixed",
      left: Math.max(16, Math.min(window.innerWidth - 340 - 16, x)),
      top: placeBelow ? y + h + 12 : Math.max(16, y - 180),
      width: 340,
      maxWidth: "calc(100vw - 32px)",
    };
  }

  return (
    <div className="fixed inset-0 z-[60]" aria-modal>
      <div
        className="absolute inset-0"
        style={spotlight ? { background: "transparent" } : { background: "rgba(0,0,0,0.55)" }}
        onClick={() => close(true)}
      />
      {spotlight && <div style={spotlight} />}
      <div
        style={bubble}
        className="rounded-[14px] border border-line-2 bg-surface/95 backdrop-blur-xl p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-1.5">
              {idx + 1} / {steps.length}
            </div>
            <div className="text-[15px] font-semibold text-ink leading-snug">{step.title}</div>
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            aria-label="close"
            className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-white/[0.08] hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
        <p className="mt-3 text-[13.5px] leading-6 text-ink-2">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => close(true)}
            className="text-[12px] text-ink-3 hover:text-ink"
          >
            {labels.skip}
          </button>
          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={prev}
                className="rounded-md border border-line-2 px-3 py-1.5 text-[12px] text-ink-2 hover:text-ink hover:bg-white/[0.06]"
              >
                {labels.prev}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-3 py-1.5 text-[12px] font-medium text-white hover:brightness-110"
            >
              {idx + 1 === steps.length ? labels.done : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
