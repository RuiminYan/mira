"use client";

import { useState } from "react";
import { Sparkles, Crown } from "lucide-react";
import type { Preview, Talent } from "@/db/schema";

export function PreviewCarousel({
  talent,
  previews,
}: {
  talent: Talent;
  previews: Preview[];
}) {
  const [idx, setIdx] = useState(0);
  const list = previews.length > 0 ? previews : [];
  const cur = list[idx];

  const posterUrl = cur?.posterUrl ?? talent.avatarUrl ?? null;
  const videoUrl = cur?.videoUrl ?? talent.videoUrl ?? null;
  const bg = talent.cover;

  return (
    <div className="grid gap-3">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-line glow-ring"
        style={{ background: bg }}
      >
        {videoUrl ? (
          <video
            key={cur?.id ?? "fallback"}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={cur?.scene ?? talent.stageName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-overlay opacity-60"
              style={{
                background:
                  "radial-gradient(70% 60% at 50% 30%, rgba(255,255,255,0.45) 0%, transparent 60%)",
              }}
            />
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full opacity-30 mix-blend-overlay"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <circle cx="50" cy="38" r="20" fill="#fff" />
              <path d="M16 100 C 20 70 35 60 50 60 C 65 60 80 70 84 100 Z" fill="#fff" />
            </svg>
          </>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium " +
              (talent.grade === "S"
                ? "bg-gradient-to-r from-[#FF6FB4] to-[#6E59F6] text-white"
                : "bg-white/15 text-white")
            }
          >
            {talent.grade === "S" ? <Crown size={12} /> : null}
            {talent.grade} 级
          </span>
          {talent.exclusive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[12px] text-white backdrop-blur">
              <Sparkles size={12} /> 独家
            </span>
          )}
        </div>

        {cur && (
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <div className="text-[11px] uppercase tracking-widest opacity-80">场景预览</div>
              <div className="text-[18px] font-semibold drop-shadow">{cur.scene}</div>
            </div>
            <div className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] backdrop-blur">
              {cur.durationSec}s · {idx + 1}/{list.length}
            </div>
          </div>
        )}
      </div>

      {list.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {list.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIdx(i)}
              className={
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border transition " +
                (i === idx
                  ? "border-brand ring-2 ring-brand/40"
                  : "border-line hover:border-line-2")
              }
              style={{ background: talent.cover }}
              aria-label={`切换到 ${p.scene}`}
            >
              {p.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.posterUrl}
                  alt={p.scene}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-[10px] text-white">
                {p.scene}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
