import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata = { title: "正在发生 · 活动流" };

const PAGE_SIZE = 20;

type Search = Promise<{ p?: string }>;

const KIND_LABEL: Record<string, string> = {
  order_settled: "结算",
  talent_listed: "上架",
  verification_approved: "实名",
  distribution_live: "上线",
};

const KIND_TONE: Record<string, string> = {
  order_settled: "bg-emerald-500/15 text-emerald-300",
  talent_listed: "bg-sky-500/15 text-sky-300",
  verification_approved: "bg-indigo-500/15 text-indigo-300",
  distribution_live: "bg-amber-500/15 text-amber-300",
};

function fmtRelative(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function ActivityPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const total = db.select({ c: sql<number>`count(*)` }).from(schema.activities).get();
  const totalPages = Math.max(1, Math.ceil((total?.c ?? 0) / PAGE_SIZE));

  const rows = db
    .select()
    .from(schema.activities)
    .orderBy(desc(schema.activities.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)
    .all();

  return (
    <section className="container-page py-12 md:py-16">
      <div className="mb-3 text-[12px] uppercase tracking-widest text-ink-3">Live Feed</div>
      <h1 className="text-balance text-[32px] font-semibold leading-tight md:text-[40px]">
        正在发生 · <span className="text-gradient">Mira 活动流</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-3">
        实名通过、新形象上架、订单结算、渠道上线 —— 所有公开事件按时间倒序展示。已脱敏:不显示制作方真实名称、具体金额按订单授权费披露。
      </p>

      <div className="mt-8">
        {rows.length === 0 ? (
          <div className="glass rounded-[14px] p-10 text-center text-ink-3">
            还没有公开事件 · 第一条很快就会出现
          </div>
        ) : (
          <div className="glass rounded-[14px] divide-y divide-line">
            {rows.map((a) => (
              <div key={a.id} className="px-5 py-4 flex flex-wrap items-center gap-3">
                <span
                  className={
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] shrink-0 " +
                    (KIND_TONE[a.kind] ?? "bg-white/[0.06] text-ink-2")
                  }
                >
                  {KIND_LABEL[a.kind] ?? a.kind}
                </span>
                <div className="text-[14px] text-ink leading-6 flex-1 min-w-0">{a.displayText}</div>
                <div className="text-[11px] text-ink-3 ml-auto">{fmtRelative(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-[13px]">
          <div className="text-ink-3">
            第 {page} / {totalPages} 页 · 共 {total?.c ?? 0} 条
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/activity?p=${page - 1}`}
                className="rounded-md border border-line px-3 py-1.5 text-ink-2 hover:text-ink"
              >
                ← 上一页
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/activity?p=${page + 1}`}
                className="rounded-md border border-line px-3 py-1.5 text-ink-2 hover:text-ink"
              >
                下一页 →
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
