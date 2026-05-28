import { notFound } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { Star } from "lucide-react";
import { db, schema } from "@/db";
import { avgRatingFor, parseTags } from "@/lib/review";
import { getPinnedBadges } from "@/lib/badges";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const u = db.select().from(schema.users).where(eq(schema.users.id, Number(p.id))).get();
  if (!u || u.role !== "partner") return { title: "制作方主页" };
  return {
    title: `${u.nickname} · 制作方主页`,
    description: `${u.nickname} 在 Mira 镜界 的合作记录与评价。`,
  };
}

export default async function PartnerPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await params;
  const id = Number(p.id);
  const u = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!u || u.role !== "partner") notFound();

  const settled = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.partnerId, id))
    .all();
  const settledCount = settled.filter((o) => o.status === "settled").length;
  const stat = db
    .select({
      total: sql<number>`coalesce(sum(${schema.orders.amount}), 0)`,
    })
    .from(schema.orders)
    .where(eq(schema.orders.partnerId, id))
    .get();

  const collaboratorTalentIds = Array.from(new Set(settled.map((o) => o.talentId)));
  const talents =
    collaboratorTalentIds.length > 0
      ? db.select().from(schema.talents).where(inArray(schema.talents.id, collaboratorTalentIds)).all()
      : [];
  const creatorIds = Array.from(new Set(talents.map((t) => t.creatorId)));
  const creators =
    creatorIds.length > 0
      ? db.select().from(schema.users).where(inArray(schema.users.id, creatorIds)).all()
      : [];

  const reviews = db
    .select({ r: schema.reviews, fromName: schema.users.nickname })
    .from(schema.reviews)
    .leftJoin(schema.users, eq(schema.users.id, schema.reviews.fromUserId))
    .where(eq(schema.reviews.toUserId, id))
    .orderBy(desc(schema.reviews.createdAt))
    .all();
  const rating = avgRatingFor(id);
  const pinned = getPinnedBadges(id);

  const initial = u.nickname.slice(0, 1).toUpperCase();

  return (
    <section className="container-page py-10 md:py-14">
      {pinned.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pinned.map((p) => (
            <span
              key={p.ub.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#22D3EE]/15 to-[#6E59F6]/10 border border-line-2 px-3 py-1 text-[12px] text-ink-2"
              title={p.b.description}
            >
              <span className="text-[14px]">★</span>
              <span>{p.b.name}</span>
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-[1fr_2fr] items-start">
        <div className="rounded-[18px] border border-line bg-gradient-to-br from-[#22D3EE]/10 to-[#6E59F6]/8 p-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#6E59F6] grid place-items-center text-white text-[32px] font-medium">
            {initial}
          </div>
          <h1 className="mt-4 text-[22px] font-semibold">{u.nickname}</h1>
          <div className="mt-1 text-[12px] uppercase tracking-widest text-ink-4">Studio · Mira</div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[18px] font-semibold tabular-nums">{settledCount}</div>
              <div className="text-[11px] text-ink-4">已结算项目</div>
            </div>
            <div>
              <div className="text-[18px] font-semibold tabular-nums">
                ¥{((stat?.total ?? 0) / 1000).toFixed(1)}k
              </div>
              <div className="text-[11px] text-ink-4">累计支付</div>
            </div>
            <div>
              <div className="text-[18px] font-semibold tabular-nums">
                {rating.count > 0 ? rating.avg.toFixed(1) : "—"}
              </div>
              <div className="text-[11px] text-ink-4">评价均分</div>
            </div>
          </div>

          <Link
            href={`/contact?to=partner&ref=${id}`}
            className="mt-5 inline-flex items-center justify-center w-full rounded-md px-3 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#22D3EE] to-[#6E59F6] hover:brightness-110"
          >
            合作邀约
          </Link>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">合作创作者</div>
          {creators.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
              暂无合作记录
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {creators.map((c) => (
                <Link
                  key={c.id}
                  href={`/u/${c.id}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface/40 px-3 py-1.5 hover:border-line-2"
                >
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] grid place-items-center text-[11px] text-white">
                    {c.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-[13px]">{c.nickname}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">
          评价 · {reviews.length} 条
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            还没有评价
          </div>
        ) : (
          <div className="grid gap-3">
            {reviews.map((row) => (
              <article key={row.r.id} className="rounded-[10px] border border-line bg-surface/40 p-4">
                <div className="flex items-center gap-2">
                  <Stars value={row.r.rating} />
                  <div className="text-[13px] font-medium">{row.r.rating.toFixed(1)}</div>
                  <div className="text-[11.5px] text-ink-4 ml-auto">
                    {new Date(row.r.createdAt * 1000).toLocaleDateString("zh-CN")} · {mask(row.fromName)}
                  </div>
                </div>
                {row.r.body && <p className="mt-2 text-[13.5px] text-ink-2 leading-6">{row.r.body}</p>}
                {parseTags(row.r.tags).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parseTags(row.r.tags).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-ink-3"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < value ? "text-amber-300 fill-amber-300" : "text-ink-4"}
        />
      ))}
    </div>
  );
}

function mask(name: string | null | undefined): string {
  if (!name) return "匿名";
  if (name.length <= 2) return name.slice(0, 1) + "*";
  return name.slice(0, 1) + "*".repeat(name.length - 2) + name.slice(-1);
}
