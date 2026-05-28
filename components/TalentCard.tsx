import Link from "next/link";
import type { Talent } from "@/db/schema";
import { Crown, Sparkles } from "lucide-react";

const GRADE_STYLE: Record<string, string> = {
  S: "bg-gradient-to-r from-[#FF6FB4] to-[#6E59F6] text-white",
  A: "bg-white/15 text-ink",
  B: "bg-white/8 text-ink-2",
};

export function TalentCard({ talent, href = `/marketplace/${talent.id}` }: { talent: Talent; href?: string }) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[14px] border border-line bg-surface transition hover:border-line-2 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] w-full" style={{ background: talent.cover }}>
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-overlay opacity-60"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 30%, rgba(255,255,255,0.5) 0%, transparent 60%)",
          }}
        />
        <FaceSilhouette />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="text-[15px] font-semibold drop-shadow">{talent.stageName}</div>
              <div className="text-[11px] opacity-85 mt-0.5">
                {talent.gender === "female" ? "女" : talent.gender === "male" ? "男" : "中性"} ·{" "}
                {talent.ageBand}
              </div>
            </div>
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                GRADE_STYLE[talent.grade]
              }
            >
              {talent.grade === "S" ? <Crown size={11} /> : null}
              {talent.grade} 级
            </span>
          </div>
        </div>
        {talent.exclusive && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2 py-0.5 text-[11px] text-white">
            <Sparkles size={10} /> 独家
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {talent.styleTags
            .split(",")
            .slice(0, 4)
            .map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/[0.06] text-ink-2 text-[11px] px-2 py-0.5"
              >
                {t.trim()}
              </span>
            ))}
        </div>
        <p className="text-[13px] text-ink-3 leading-5 line-clamp-2 mb-4">{talent.bio}</p>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] text-ink-4 uppercase tracking-widest">起拍 / 单部</div>
            <div className="text-[20px] font-semibold text-gradient leading-none">
              ¥{talent.priceOnce.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-ink-4 uppercase tracking-widest">分账</div>
            <div className="text-[14px] font-medium text-ink">{talent.revenueShare}%</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FaceSilhouette() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <circle cx="50" cy="38" r="20" fill="#fff" />
      <path d="M16 100 C 20 70 35 60 50 60 C 65 60 80 70 84 100 Z" fill="#fff" />
    </svg>
  );
}
