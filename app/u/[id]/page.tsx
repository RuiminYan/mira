import { notFound } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { ShieldCheck, Star } from "lucide-react";
import { db, schema } from "@/db";
import { TalentCard } from "@/components/TalentCard";
import { avgRatingFor, parseTags } from "@/lib/review";
import { getPinnedBadges } from "@/lib/badges";
import { findUserByIdOrSlug } from "@/lib/userSlug";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const u = findUserByIdOrSlug(p.id);
  if (!u || u.role !== "creator") return { title: "创作者主页" };
  const canonicalPath = u.publicSlug ? `/u/${u.publicSlug}` : `/u/${u.id}`;
  return {
    title: `${u.nickname} · 创作者主页`,
    description: `${u.nickname} 在 Mira 镜界 的公开作品集与合作评价。`,
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default async function CreatorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await params;
  const u = findUserByIdOrSlug(p.id);
  if (!u || u.role !== "creator") notFound();
  const id = u.id;
  const canonicalPath = u.publicSlug ? `/u/${u.publicSlug}` : `/u/${id}`;

  const talents = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.creatorId, id))
    .orderBy(desc(schema.talents.createdAt))
    .all();
  const liveTalents = talents.filter((t) => t.status === "live");

  // settled order count + sum
  const stat = db
    .select({
      c: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${schema.revenues.amount}), 0)`,
    })
    .from(schema.revenues)
    .where(eq(schema.revenues.creatorId, id))
    .get();

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
      <link rel="canonical" href={canonicalPath} />
      {pinned.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pinned.map((pb) => (
            <span
              key={pb.ub.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#6E59F6]/15 to-[#FF6FB4]/10 border border-line-2 px-3 py-1 text-[12px] text-ink-2"
              title={pb.b.description}
            >
              <span className="text-[14px]">★</span>
              <span>{pb.b.name}</span>
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-[1fr_2fr] items-start">
        <div className="rounded-[18px] border border-line bg-gradient-to-br from-[#6E59F6]/12 to-[#FF6FB4]/8 p-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] grid place-items-center text-white text-[32px] font-medium">
            {initial}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-[22px] font-semibold">{u.nickname}</h1>
            {u.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[11px]">
                <ShieldCheck size={11} /> 已实名
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[12px] uppercase tracking-widest text-ink-4">Creator · Mira</div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[18px] font-semibold tabular-nums">{liveTalents.length}</div>
              <div className="text-[11px] text-ink-4">在售形象</div>
            </div>
            <div>
              <div className="text-[18px] font-semibold tabular-nums">{stat?.c ?? 0}</div>
              <div className="text-[11px] text-ink-4">分账次数</div>
            </div>
            <div>
              <div className="text-[18px] font-semibold tabular-nums">
                {rating.count > 0 ? rating.avg.toFixed(1) : "—"}
              </div>
              <div className="text-[11px] text-ink-4">评价均分</div>
            </div>
          </div>

          <div className="mt-5 text-[12.5px] text-ink-3">
            累计授权与分账金额{" "}
            <span className="text-ink font-medium">¥{(stat?.total ?? 0).toLocaleString()}</span>
          </div>

          <Link
            href={`/contact?to=creator&ref=${id}`}
            className="mt-5 inline-flex items-center justify-center w-full rounded-md px-3 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110"
          >
            合作邀约
          </Link>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">形象作品</div>
          {liveTalents.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
              该创作者暂无在售形象
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {liveTalents.map((t) => (
                <TalentCard key={t.id} talent={t} />
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
              <article
                key={row.r.id}
                className="rounded-[10px] border border-line bg-surface/40 p-4"
              >
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
