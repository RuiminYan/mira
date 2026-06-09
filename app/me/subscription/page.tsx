import { redirect } from "next/navigation";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { changeSubscription, cancelSubscription } from "@/app/actions/plans";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "我的订阅" };

const loadSearch = createLoader({ ok: parseAsString, upgrade: parseAsString });

export default async function MySubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/subscription");
  const sp = await loadSearch(searchParams);

  const sub = db
    .select({ s: schema.subscriptions, p: schema.plans })
    .from(schema.subscriptions)
    .leftJoin(schema.plans, eq(schema.plans.id, schema.subscriptions.planId))
    .where(eq(schema.subscriptions.userId, u.id))
    .get();

  const plans = db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.status, "live"))
    .orderBy(desc(schema.plans.sortOrder))
    .all()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // current usage
  const now = Math.floor(Date.now() / 1000);
  const monthAgo = now - 86400 * 30;
  const orderUsage = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.orders)
    .where(and(eq(schema.orders.partnerId, u.id), gte(schema.orders.createdAt, monthAgo)))
    .get();
  const orderCount = orderUsage?.c ?? 0;

  const quota = sub?.p?.quotaOrders ?? 10;
  const percent = quota > 0 ? Math.min(100, Math.round((orderCount / quota) * 100)) : 0;

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">账户</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">我的订阅</h1>

      {sp.ok && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          {sp.ok === "change" ? "订阅已更新。" : sp.ok === "cancel" ? "已取消自动续费。" : ""}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="md:col-span-1 rounded-[14px] border border-line bg-gradient-to-br from-[#6E59F6]/12 to-[#FF6FB4]/8 p-6">
          <div className="text-[12px] uppercase tracking-widest text-ink-3">当前套餐</div>
          <div className="mt-2 text-[22px] font-semibold">
            {sub?.p?.name ?? "未订阅"}
          </div>
          {sub?.s && (
            <>
              <div className="mt-1 text-[12px] text-ink-3">
                状态 {sub.s.status} · 自动续费 {sub.s.autoRenew ? "已开启" : "已关闭"}
              </div>
              {sub.s.endsAt && (
                <div className="mt-2 text-[12.5px] text-ink-3">
                  本周期至 {new Date(sub.s.endsAt * 1000).toLocaleDateString("zh-CN")}
                </div>
              )}
              {sub.s.status !== "cancelled" && (
                <form action={cancelSubscription} className="mt-4">
                  <button className="text-[12.5px] text-ink-3 hover:text-red-300">取消自动续费</button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
          <UsageCard label="本月订单" value={`${orderCount} / ${quota || "∞"}`} percent={percent} />
          <UsageCard label="团队席位" value={`${sub?.p?.quotaSeats ?? 1}`} />
          <UsageCard label="API 调用 / 月" value={`${(sub?.p?.quotaApiCalls ?? 0).toLocaleString()}`} />
        </div>
      </div>

      <h2 className="mt-12 text-[18px] font-semibold">可选套餐</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = sub?.p?.id === p.id;
          return (
            <div
              key={p.id}
              className={
                "rounded-[14px] p-5 border " +
                (isCurrent ? "border-brand-2/40 bg-brand-soft" : "border-line bg-surface/40")
              }
            >
              <div className="text-[12px] uppercase tracking-widest text-ink-3">{p.code}</div>
              <div className="mt-1 text-[18px] font-semibold">{p.name}</div>
              <div className="mt-3 text-[22px] font-semibold text-gradient leading-none">
                {p.priceMonth === 0 ? "免费" : p.code === "enterprise" ? "询价" : `¥${(p.priceMonth / 100).toFixed(0)}/月`}
              </div>
              <div className="mt-3 text-[12.5px] text-ink-3">
                月度订单配额 {p.quotaOrders || "无限"} · 席位 {p.quotaSeats}
              </div>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="inline-block rounded-md bg-white/[0.08] px-3 py-1.5 text-[12.5px] text-ink-2">当前套餐</span>
                ) : p.code === "enterprise" ? (
                  <a href="/pricing#enterprise" className="inline-block rounded-md border border-line-2 px-3 py-1.5 text-[12.5px] text-ink-2">
                    联系销售
                  </a>
                ) : (
                  <form action={changeSubscription}>
                    <input type="hidden" name="planCode" value={p.code} />
                    <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-3 py-1.5 text-[12.5px] font-medium">
                      切换到 {p.name}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UsageCard({ label, value, percent }: { label: string; value: string; percent?: number }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface/40 p-4">
      <div className="text-[11px] uppercase tracking-widest text-ink-3">{label}</div>
      <div className="mt-1 text-[20px] font-semibold tabular-nums">{value}</div>
      {typeof percent === "number" && (
        <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
