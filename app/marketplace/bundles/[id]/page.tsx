import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { Layers, MessageCircle, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { placeBundleOrder } from "@/app/actions/bundles";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const b = db.select().from(schema.bundles).where(eq(schema.bundles.id, Number(p.id))).get();
  return { title: b ? b.name : "套餐" };
}

type Search = Promise<{ err?: string }>;

export default async function BundleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const p = await params;
  const sp = await searchParams;
  const id = Number(p.id);
  const b = db.select().from(schema.bundles).where(eq(schema.bundles.id, id)).get();
  if (!b) notFound();

  const items = db
    .select()
    .from(schema.bundleItems)
    .where(eq(schema.bundleItems.bundleId, id))
    .all();
  const talents = items.length
    ? db
        .select()
        .from(schema.talents)
        .where(
          inArray(
            schema.talents.id,
            items.map((i) => i.talentId)
          )
        )
        .all()
    : [];

  const u = await getCurrentUser();
  const canOrder = u && (u.role === "partner" || u.role === "admin");

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/marketplace/bundles" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回套餐列表
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-line glow-ring"
          style={{ background: b.coverHint }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute left-5 right-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[12px] text-white backdrop-blur">
            <Layers size={12} /> {b.talentCount} 张脸 · 立省 {b.discountPct}%
          </div>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="text-[12px] uppercase tracking-widest opacity-80">套餐</div>
            <div className="text-[28px] font-semibold">{b.name}</div>
          </div>
        </div>

        <div>
          <h1 className="text-[28px] font-semibold leading-tight md:text-[32px]">{b.name}</h1>
          <p className="mt-3 text-[14.5px] leading-7 text-ink-2">{b.description}</p>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-ink-4">套餐总价</div>
              <div className="text-[28px] font-semibold leading-none text-gradient">
                ¥{b.priceTotal.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md bg-white/[0.06] px-3 py-1.5 text-[12px] text-ink-2">
              整体下单一次性签约,链上存证
            </div>
          </div>

          {sp.err && (
            <div className="mt-4 inline-flex rounded-md bg-red-500/15 px-3 py-1.5 text-[12px] text-red-300">
              {sp.err === "fields" ? "请补齐项目名与场景" : sp.err}
            </div>
          )}

          {canOrder ? (
            <form action={placeBundleOrder} className="mt-6 grid gap-3">
              <input type="hidden" name="bundleId" value={b.id} />
              <Field name="projectName" label="项目名称" placeholder="如《九重凤阙》古装长剧" required />
              <Field name="scope" label="授权场景" placeholder="如 整剧角色 · 季度档" required />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[14px] font-medium text-white shadow-[0_10px_30px_-12px_rgba(110,89,246,0.55)] transition hover:brightness-110"
              >
                整体下单 ¥{b.priceTotal.toLocaleString()}
              </button>
              <Link
                href={`/partner/quotes/new?bundleId=${b.id}`}
                className="inline-flex items-center gap-1 text-[12px] text-brand hover:underline"
              >
                <MessageCircle size={12} /> 我想议价 · 反向报价
              </Link>
            </form>
          ) : (
            <div className="mt-6 text-[13.5px] leading-6 text-ink-3">
              {u
                ? "请切换到制作方账号下单。"
                : "请先以制作方身份登录后整体下单。"}
              <div className="mt-3">
                <Link
                  href={`/login?role=partner&next=/marketplace/bundles/${b.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
                >
                  以制作方身份登录
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 text-[12px] uppercase tracking-widest text-ink-3">套餐内形象</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {talents.map((t) => (
            <Link
              key={t.id}
              href={`/marketplace/${t.id}`}
              className="glass flex items-center gap-3 rounded-[12px] p-3 transition hover:bg-white/[0.06]"
            >
              <div className="h-14 w-14 shrink-0 rounded-md" style={{ background: t.cover }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-ink">{t.stageName}</div>
                <div className="truncate text-[12px] text-ink-3">{t.styleTags}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[13px] text-ink">¥{t.priceOnce.toLocaleString()}</div>
                <div className="text-[11px] text-ink-3">分账 {t.revenueShare}%</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 text-[12px] text-ink-3 inline-flex items-center gap-2">
        <ShieldCheck size={12} className="text-brand-2" /> 整体下单自动签订《AI 肖像批量授权合同》并上链
      </div>
    </section>
  );
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
