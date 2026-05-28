import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Layers, Sparkles, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";

export const metadata = { title: "套餐 SKU" };

export default async function BundlesPage() {
  const list = db
    .select()
    .from(schema.bundles)
    .where(and(eq(schema.bundles.kind, "preset"), eq(schema.bundles.status, "live")))
    .orderBy(desc(schema.bundles.createdAt))
    .all();

  const allItems = db
    .select()
    .from(schema.bundleItems)
    .where(
      inArray(
        schema.bundleItems.bundleId,
        list.map((b) => b.id)
      )
    )
    .all();
  const talentIds = Array.from(new Set(allItems.map((i) => i.talentId)));
  const talents = talentIds.length
    ? db.select().from(schema.talents).where(inArray(schema.talents.id, talentIds)).all()
    : [];

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/marketplace" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回选角广场
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Bundles</div>
          <h1 className="text-[32px] font-semibold leading-tight md:text-[40px]">
            套餐 SKU · <span className="text-gradient">一键打包接档</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] text-ink-3">
            预置闺蜜局、职场局、古装爽剧主线等组合,直接整体下单或发起反向议价。
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => {
          const items = allItems.filter((i) => i.bundleId === b.id);
          const itemTalents = items
            .map((i) => talents.find((t) => t.id === i.talentId))
            .filter((t): t is NonNullable<typeof t> => !!t);
          return (
            <Link
              key={b.id}
              href={`/marketplace/bundles/${b.id}`}
              className="group glass relative overflow-hidden rounded-[14px] border border-line transition hover:border-line-2"
            >
              <div className="relative h-32" style={{ background: b.coverHint }}>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-white">
                  <div className="inline-flex items-center gap-1.5 text-[14px] font-semibold">
                    <Layers size={14} /> {b.name}
                  </div>
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] backdrop-blur">
                    {b.talentCount} 张脸 · 立省 {b.discountPct}%
                  </span>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                <p className="line-clamp-2 text-[13px] leading-5 text-ink-3">{b.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {itemTalents.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-2"
                    >
                      {t.stageName.split(" ")[0]}
                    </span>
                  ))}
                </div>

                <div className="mt-1 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-ink-4">套餐总价</div>
                    <div className="text-[22px] font-semibold leading-none text-gradient">
                      ¥{b.priceTotal.toLocaleString()}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] text-ink-2">
                    <ShieldCheck size={11} className="text-brand-2" /> 整体上链
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 text-[12px] text-ink-3">
        想要自定义打包?在选角广场单独下单或发起{" "}
        <Link href="/partner/quotes" className="text-brand hover:underline">
          反向议价
        </Link>
        。
      </div>
      <Sparkles aria-hidden className="hidden" />
    </section>
  );
}
