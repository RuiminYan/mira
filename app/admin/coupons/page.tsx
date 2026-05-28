import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { archiveCoupon, createCoupon, reactivateCoupon } from "@/app/actions/coupons";
import { couponKindLabel } from "@/lib/coupon";

export const metadata = { title: "优惠券管理" };

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/coupons");
  if (u.role !== "admin") redirect("/");
  const sp = await searchParams;
  const list = db
    .select()
    .from(schema.coupons)
    .orderBy(desc(schema.coupons.createdAt))
    .all();

  const redemptions = db
    .select({ r: schema.couponRedemptions, code: schema.coupons.code })
    .from(schema.couponRedemptions)
    .leftJoin(schema.coupons, eq(schema.coupons.id, schema.couponRedemptions.couponId))
    .orderBy(desc(schema.couponRedemptions.redeemedAt))
    .limit(20)
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${list.length} 张`}>优惠券</PanelTitle>

      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已创建
        </div>
      )}
      {sp.err && (
        <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-[13px] text-rose-300">
          {sp.err === "dup" ? "代码已存在" : sp.err === "pct" ? "百分比需 1-100" : "填写不完整"}
        </div>
      )}

      <form
        action={createCoupon}
        className="grid gap-3 md:grid-cols-6 mb-8 rounded-md border border-line bg-surface/40 p-4"
      >
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">代码</span>
          <input
            name="code"
            required
            placeholder="WELCOME10"
            className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">类型</span>
          <select name="kind" className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]">
            <option value="discount_pct">百分比折扣</option>
            <option value="discount_fix">立减(分)</option>
            <option value="credits">credits</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">值</span>
          <input
            name="value"
            type="number"
            min="1"
            required
            className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">最低消费(元)</span>
          <input
            name="minSpend"
            type="number"
            min="0"
            defaultValue={0}
            className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">总份数(0 不限)</span>
          <input
            name="quota"
            type="number"
            min="0"
            defaultValue={0}
            className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">截止日</span>
          <input
            name="endsAt"
            type="date"
            className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]"
          />
        </label>
        <div className="md:col-span-6">
          <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13px]">
            创建优惠券
          </button>
        </div>
      </form>

      <div className="rounded-md border border-line overflow-x-auto mb-10">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">代码</th>
              <th className="text-left px-3 py-2">类型</th>
              <th className="text-right px-3 py-2">值</th>
              <th className="text-right px-3 py-2">已用 / 总数</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-3">
                  暂无优惠券
                </td>
              </tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono">{c.code}</td>
                <td className="px-3 py-2">{couponKindLabel(c.kind)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.kind === "discount_pct"
                    ? `${c.value}%`
                    : c.kind === "discount_fix"
                      ? `¥${(c.value / 100).toFixed(2)}`
                      : `${c.value} credits`}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.used}
                  {c.quota > 0 ? ` / ${c.quota}` : " / ∞"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11.5px] " +
                      (c.status === "live"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-white/[0.08] text-ink-3")
                    }
                  >
                    {c.status === "live" ? "进行中" : "已归档"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {c.status === "live" ? (
                    <form action={archiveCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-ink-3 hover:text-ink text-[12px]">归档</button>
                    </form>
                  ) : (
                    <form action={reactivateCoupon}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-ink-3 hover:text-ink text-[12px]">重启</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PanelTitle hint={`${redemptions.length} 条`}>最近核销</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">时间</th>
              <th className="text-left px-3 py-2">代码</th>
              <th className="text-right px-3 py-2">让利</th>
              <th className="text-left px-3 py-2">订单</th>
            </tr>
          </thead>
          <tbody>
            {redemptions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-ink-3">
                  暂无核销
                </td>
              </tr>
            )}
            {redemptions.map((r) => (
              <tr key={r.r.id} className="border-t border-line">
                <td className="px-3 py-2 text-ink-3">
                  {new Date(r.r.redeemedAt * 1000).toLocaleString("zh-CN")}
                </td>
                <td className="px-3 py-2 font-mono">{r.code}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ¥{(r.r.discountAmount).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-ink-3">
                  {r.r.orderId ? `#${r.r.orderId}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
