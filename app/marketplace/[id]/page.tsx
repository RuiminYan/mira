import { notFound } from "next/navigation";
import { eq, desc, asc, and } from "drizzle-orm";
import { Crown, Sparkles, ShieldCheck, Coins, FileCheck, Users, MessageCircle, Boxes, Wand2 } from "lucide-react";
import { db, schema } from "@/db";
import { placeOrder } from "@/app/actions/orders";
import { getCurrentUser } from "@/lib/auth";
import { relatedTalents } from "@/lib/recommend";
import { PreviewCarousel } from "@/components/PreviewCarousel";
import { TalentCard } from "@/components/TalentCard";
import { getNftByTalentId } from "@/lib/nft";
import { getLocale, t as i18n_t } from "@/lib/i18n";
import { toggleFavorite, addToShortlist } from "@/app/actions/favorites";
import { avgRatingFor, parseTags } from "@/lib/review";
import { Star, Heart, ListPlus } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const tl = db.select().from(schema.talents).where(eq(schema.talents.id, Number(p.id))).get();
  if (!tl) return { title: "AI actor" };
  const description = tl.bio.slice(0, 140);
  return {
    title: tl.stageName,
    description,
    openGraph: {
      title: tl.stageName,
      description,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: tl.stageName,
      description,
      images: ["/twitter-image"],
    },
  };
}

export default async function TalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, id)).get();
  if (!t) notFound();

  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
  const recentOrders = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.talentId, id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(4)
    .all();

  const previews = db
    .select()
    .from(schema.previews)
    .where(eq(schema.previews.talentId, id))
    .orderBy(asc(schema.previews.order))
    .all();

  const others = db
    .select()
    .from(schema.talents)
    .where(and(eq(schema.talents.status, "live")))
    .all();
  const related = relatedTalents(t, others, 6);

  const u = await getCurrentUser();
  const canOrder = u && (u.role === "partner" || u.role === "admin");
  const canStudio = u && (u.role === "partner" || u.role === "creator" || u.role === "admin");

  // favorites + shortlists for partner user
  let isFavorited = false;
  let myShortlists: { id: number; name: string }[] = [];
  if (u && (u.role === "partner" || u.role === "admin")) {
    const fav = db
      .select()
      .from(schema.favorites)
      .where(and(eq(schema.favorites.userId, u.id), eq(schema.favorites.talentId, id), eq(schema.favorites.list, "default")))
      .get();
    isFavorited = !!fav;
    myShortlists = db
      .select({ id: schema.shortlists.id, name: schema.shortlists.name })
      .from(schema.shortlists)
      .where(eq(schema.shortlists.userId, u.id))
      .all();
  }

  // reviews for creator
  const reviewsRaw = db
    .select({ r: schema.reviews, fromName: schema.users.nickname })
    .from(schema.reviews)
    .leftJoin(schema.users, eq(schema.users.id, schema.reviews.fromUserId))
    .where(and(eq(schema.reviews.toUserId, t.creatorId), eq(schema.reviews.role, "partner_to_creator")))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(6)
    .all();
  const rating = avgRatingFor(t.creatorId);

  const tags = t.styleTags.split(",").map((s) => s.trim());

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => i18n_t(k, locale, v);
  const nft = getNftByTalentId(t.id);

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/marketplace" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回选角广场
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <PreviewCarousel talent={t} previews={previews} />

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-[12px] uppercase tracking-widest text-ink-3">
              {t.gender === "female"
                ? tr("gender.female")
                : t.gender === "male"
                  ? tr("gender.male")
                  : tr("gender.neutral")}{" "}
              · {t.ageBand}
            </div>
            {nft ? (
              <Link
                href={`/nft/${nft.tokenId}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6E59F6]/15 to-[#FF6FB4]/15 border border-line-2 px-3 py-1 text-[12px] font-mono text-ink hover:bg-white/[0.08]"
              >
                <Boxes size={12} /> {tr("market.nft.minted", { tokenId: nft.tokenId })} →
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12px] text-ink-3">
                <Boxes size={12} /> {tr("market.nft.unminted")}
              </span>
            )}
          </div>
          <h1 className="text-[36px] font-semibold leading-tight md:text-[44px]" data-tour="talent-detail">
            {t.stageName}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-2">{t.bio}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Quick icon={Coins} label="起拍 / 单部" value={`¥${t.priceOnce.toLocaleString()}`} />
            <Quick icon={ShieldCheck} label="分账抽成" value={`${t.revenueShare}%`} />
            <Quick
              icon={Users}
              label="原创作者"
              value={creator?.nickname ?? "—"}
              sub={`粉丝 ${t.followers.toLocaleString()}`}
            />
          </div>

          {u && (u.role === "partner" || u.role === "admin") && (
            <div className="mt-5 flex flex-wrap gap-2">
              <form action={toggleFavorite}>
                <input type="hidden" name="talentId" value={t.id} />
                <button
                  className={
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] border transition " +
                    (isFavorited
                      ? "border-rose-400/60 bg-rose-500/10 text-rose-300"
                      : "border-line text-ink-2 hover:bg-white/[0.06]")
                  }
                >
                  <Heart size={13} className={isFavorited ? "fill-rose-300" : ""} />
                  {isFavorited ? "已收藏" : "收藏"}
                </button>
              </form>
              {myShortlists.length > 0 && (
                <details className="relative">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-2 hover:bg-white/[0.06]">
                    <ListPlus size={13} /> 加入选角清单
                  </summary>
                  <div className="absolute left-0 top-full mt-1 z-10 w-56 rounded-md border border-line-2 bg-surface/95 backdrop-blur-xl shadow-2xl p-1">
                    {myShortlists.map((s) => (
                      <form key={s.id} action={addToShortlist}>
                        <input type="hidden" name="shortlistId" value={s.id} />
                        <input type="hidden" name="talentId" value={t.id} />
                        <button className="block w-full text-left rounded-md px-2.5 py-1.5 text-[13px] text-ink-2 hover:bg-white/[0.08]">
                          {s.name}
                        </button>
                      </form>
                    ))}
                    <Link
                      href="/partner/shortlists"
                      className="block text-center rounded-md px-2.5 py-1.5 text-[12.5px] text-brand hover:bg-white/[0.08] border-t border-line mt-1 pt-2"
                    >
                      新建清单 →
                    </Link>
                  </div>
                </details>
              )}
              {myShortlists.length === 0 && (
                <Link
                  href="/partner/shortlists"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[13px] text-ink-2 hover:bg-white/[0.06]"
                >
                  <ListPlus size={13} /> 新建选角清单
                </Link>
              )}
            </div>
          )}

          {canStudio && nft && (
            <div className="mt-6 glass rounded-[12px] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1 inline-flex items-center gap-1.5">
                  <Wand2 size={12} /> AI Studio
                </div>
                <div className="text-[13.5px] text-ink-2">{tr("market.studio.cta")}</div>
              </div>
              <Link
                href={`/studio/jobs/new?talentId=${t.id}&kind=video`}
                className="shrink-0 rounded-md border border-line-2 px-3 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-white/[0.06]"
              >
                {tr("market.studio.cta")} →
              </Link>
            </div>
          )}

          <div className="glass mt-8 rounded-[14px] p-6">
            <div className="mb-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-widest text-ink-3">
              <FileCheck size={14} /> 下单授权
            </div>
            {t.status === "taken_down" ? (
              <div className="text-[13.5px] leading-6 text-ink-3">
                此形象已被原创作者申请下架(被遗忘权),不再接受新订单。
              </div>
            ) : canOrder ? (
              <form action={placeOrder} className="grid gap-3">
                <input type="hidden" name="talentId" value={t.id} />
                <Field name="projectName" label="项目名称" placeholder="如《财阀千金回归》第 12 集" required />
                <Field name="scope" label="授权场景" placeholder="如 短剧配角 · 单部 / TVC · 季度框" required />
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_10px_30px_-12px_rgba(110,89,246,0.55)] transition hover:brightness-110"
                >
                  以 ¥{t.priceOnce.toLocaleString()} + 分账 {t.revenueShare}% 下单
                </button>
                <div className="flex flex-wrap gap-3 text-[12px] text-ink-3">
                  <Link
                    href={`/partner/quotes/new?talentId=${t.id}`}
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    <MessageCircle size={12} /> 我想议价
                  </Link>
                  <span>下单后进入「待支付」,审核通过自动结算分账。</span>
                </div>
              </form>
            ) : (
              <div className="text-[13.5px] leading-6 text-ink-3">
                {u
                  ? `当前是${u.role === "creator" ? "创作者" : "管理员"}账号,切换到制作方账号才能下单。`
                  : "请先以制作方身份登录。"}
                <div className="mt-3">
                  <Link
                    href={`/login?role=partner&next=/marketplace/${t.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
                  >
                    以制作方身份登录
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-4 text-[12px] uppercase tracking-widest text-ink-3">近期合作</div>
        {recentOrders.length === 0 ? (
          <div className="glass rounded-[14px] p-6 text-[13.5px] text-ink-3">
            还没有人下单 · 你将是第一个授权方
          </div>
        ) : (
          <div className="grid gap-3">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="glass flex items-center justify-between gap-4 rounded-[12px] px-5 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] text-ink">{o.projectName}</div>
                  <div className="text-[12px] text-ink-3">{o.scope}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[14px] font-medium text-ink">¥{o.amount.toLocaleString()}</div>
                  <div className="text-[11px] text-ink-3">
                    {o.status === "settled"
                      ? "已结算"
                      : o.status === "approved"
                        ? "已批准"
                        : o.status === "paid"
                          ? "已支付"
                          : o.status === "delivered"
                            ? "已交付"
                            : o.status === "disputed"
                              ? "争议中"
                              : o.status === "refunded"
                                ? "已退款"
                                : o.status === "cancelled"
                                  ? "已取消"
                                  : "待支付"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewsRaw.length > 0 && (
        <div className="mt-16">
          <div className="mb-4 flex items-center gap-3 text-[12px] uppercase tracking-widest text-ink-3">
            <span>评价 · 制作方对创作者</span>
            {rating.count > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-300 normal-case tracking-normal">
                <Star size={12} className="fill-amber-300" />
                <span className="tabular-nums">{rating.avg.toFixed(1)}</span>
                <span className="text-ink-4">({rating.count})</span>
              </span>
            )}
          </div>
          <div className="grid gap-3">
            {reviewsRaw.map((row) => (
              <article key={row.r.id} className="rounded-[12px] border border-line bg-surface/40 p-4">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < row.r.rating ? "text-amber-300 fill-amber-300" : "text-ink-4"}
                      />
                    ))}
                  </div>
                  <div className="text-[12.5px] text-ink-4 ml-auto">
                    {new Date(row.r.createdAt * 1000).toLocaleDateString("zh-CN")} · {maskName(row.fromName)}
                  </div>
                </div>
                {row.r.body && <p className="mt-2 text-[13.5px] text-ink-2 leading-6">{row.r.body}</p>}
                {parseTags(row.r.tags).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parseTags(row.r.tags).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-ink-3">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-16">
          <div className="mb-4 text-[12px] uppercase tracking-widest text-ink-3">
            你可能也喜欢 · 风格 / 性别 / 年龄相近
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((rt) => (
              <TalentCard key={rt.id} talent={rt} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Quick({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-[12px] p-4">
      <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink-3">
        <Icon size={12} className="text-brand-2" /> {label}
      </div>
      <div className="truncate text-[18px] font-semibold leading-none text-ink">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

function maskName(name: string | null | undefined): string {
  if (!name) return "匿名";
  if (name.length <= 2) return name.slice(0, 1) + "*";
  return name.slice(0, 1) + "*".repeat(name.length - 2) + name.slice(-1);
}

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] uppercase tracking-widest text-ink-3">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none transition placeholder:text-ink-4 focus:border-brand/70"
      />
    </label>
  );
}

void Crown;
void Sparkles;
