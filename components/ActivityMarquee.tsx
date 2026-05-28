import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import Link from "next/link";

const KIND_LABEL: Record<string, string> = {
  order_settled: "结算",
  talent_listed: "上架",
  verification_approved: "实名",
  distribution_live: "上线",
};

const KIND_TONE: Record<string, string> = {
  order_settled: "text-emerald-300",
  talent_listed: "text-sky-300",
  verification_approved: "text-indigo-300",
  distribution_live: "text-amber-300",
};

export function ActivityMarquee({
  limit = 10,
  variant = "feed",
}: {
  limit?: number;
  variant?: "feed" | "ticker";
}) {
  const rows = db
    .select()
    .from(schema.activities)
    .orderBy(desc(schema.activities.createdAt))
    .limit(limit)
    .all();
  if (rows.length === 0) return null;

  if (variant === "ticker") {
    return (
      <div className="overflow-hidden border-y border-line py-2.5 [@media(prefers-reduced-motion:reduce)]:overflow-auto">
        <div className="flex gap-10 anim-marquee min-w-max [@media(prefers-reduced-motion:reduce)]:animate-none [@media(prefers-reduced-motion:reduce)]:flex-wrap">
          {[...rows, ...rows].map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-[12.5px] text-ink-2 whitespace-nowrap shrink-0">
              <span className={KIND_TONE[a.kind] ?? "text-ink-3"}>● {KIND_LABEL[a.kind] ?? a.kind}</span>
              <span>{a.displayText}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden glass rounded-[14px] [@media(prefers-reduced-motion:reduce)]:overflow-auto">
      <div className="flex flex-col gap-0 [@media(prefers-reduced-motion:reduce)]:gap-0 anim-scroll-y [@media(prefers-reduced-motion:reduce)]:animate-none">
        {[...rows, ...rows].map((a, i) => (
          <div
            key={i}
            className="px-5 py-3 flex items-center gap-3 border-b border-line last:border-0"
          >
            <span
              className={
                "inline-flex rounded-full px-2 py-0.5 text-[11px] shrink-0 " +
                (KIND_TONE[a.kind] ?? "text-ink-3")
              }
            >
              {KIND_LABEL[a.kind] ?? a.kind}
            </span>
            <div className="text-[13.5px] text-ink-2 flex-1 min-w-0 truncate">{a.displayText}</div>
          </div>
        ))}
      </div>
      <div className="text-center py-2 border-t border-line">
        <Link href="/activity" className="text-[12px] text-brand hover:underline">
          查看全部 →
        </Link>
      </div>
    </div>
  );
}
