import { redirect } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import Link from "next/link";

export const metadata = { title: "收益与分账" };

export default async function CreatorRevenue() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/revenue");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const rows = db
    .select({
      r: schema.revenues,
      orderName: schema.orders.projectName,
      talentName: schema.talents.stageName,
    })
    .from(schema.revenues)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.revenues.orderId))
    .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
    .where(eq(schema.revenues.creatorId, u.id))
    .orderBy(desc(schema.revenues.createdAt))
    .all();

  const totalLicense = rows.filter((x) => x.r.kind === "license").reduce((a, b) => a + b.r.amount, 0);
  const totalShare = rows.filter((x) => x.r.kind === "share").reduce((a, b) => a + b.r.amount, 0);
  const totalRefund = rows.filter((x) => x.r.kind === "refund").reduce((a, b) => a + b.r.amount, 0);
  const totalWithholding = rows
    .filter((x) => x.r.kind === "withholding")
    .reduce((a, b) => a + b.r.amount, 0);
  const total = totalLicense + totalShare;
  const netAfterTax = total + totalWithholding + totalRefund;

  const settled = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.orders)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
    .where(eq(schema.talents.creatorId, u.id))
    .get();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatTile label="授权费" value={`¥${totalLicense.toLocaleString()}`} sub="一次性入账" />
        <StatTile label="发行分账" value={`¥${totalShare.toLocaleString()}`} sub="按比例自动结算" />
        <StatTile
          label="个税代扣"
          value={`¥${Math.abs(totalWithholding).toLocaleString()}`}
          sub="20% 综合所得档"
        />
        <StatTile label="参与订单" value={String(settled?.c ?? 0)} sub="所有形象合计" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <StatTile label="税前累计" value={`¥${total.toLocaleString()}`} sub="授权费 + 分账" />
        <StatTile label="税后净到手" value={`¥${netAfterTax.toLocaleString()}`} sub="扣除个税与退款抵扣" />
      </div>

      <div className="text-[15px] font-semibold mb-3">分账流水</div>
      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          还没有流水 · 接到第一单授权后就会出现在这里。
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">形象</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ r, orderName, talentName }) => {
                const kindLabel =
                  r.kind === "share"
                    ? "发行分账"
                    : r.kind === "license"
                    ? "授权费"
                    : r.kind === "withholding"
                    ? "个税代扣"
                    : "退款抵扣";
                const positive = r.amount >= 0;
                return (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-ink">
                      {r.orderId ? (
                        <Link href={`/creator/orders/${r.orderId}`} className="hover:underline">
                          {orderName ?? "—"}
                        </Link>
                      ) : (
                        orderName ?? "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-2">{talentName ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-2">{kindLabel}</td>
                    <td
                      className={
                        "px-5 py-3 text-right font-medium " +
                        (positive ? "text-ink" : "text-amber-300")
                      }
                    >
                      {positive ? "+" : ""}¥{r.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
