import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import { ReviewBlock } from "@/components/ReviewBlock";

export const metadata = { title: "订单详情(创作者)" };

const STATUS_LABEL: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  approved: "已批准",
  delivered: "已交付",
  settled: "已结算",
  disputed: "争议中",
  refunded: "已退款",
  cancelled: "已取消",
};

export default async function CreatorOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await params;
  const id = Number(p.id);
  const u = await getCurrentUser();
  if (!u) redirect(`/login?role=creator&next=/creator/orders/${id}`);
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  if (!o) notFound();
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  if (!t || (t.creatorId !== u.id && u.role !== "admin")) redirect("/creator/revenue");

  const partner = db.select().from(schema.users).where(eq(schema.users.id, o.partnerId)).get();
  const revenues = db
    .select()
    .from(schema.revenues)
    .where(eq(schema.revenues.orderId, o.id))
    .orderBy(desc(schema.revenues.createdAt))
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <Link href="/creator/revenue" className="text-[13px] text-ink-3 hover:text-ink">
        ← 收益与分账
      </Link>
      <h1 className="mt-2 text-[24px] font-semibold">{o.projectName}</h1>
      <p className="text-[13.5px] text-ink-3 mt-1">{o.scope}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-ink-2">
          {STATUS_LABEL[o.status] ?? o.status}
        </span>
        <span className="text-ink-3">订单 #{o.id}</span>
        <span className="text-ink-3">
          ¥{o.amount.toLocaleString()} · 分账 {o.share}%
        </span>
        {partner && (
          <Link href={`/p/${partner.id}`} className="text-brand hover:underline">
            {partner.nickname} →
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <PanelTitle>资金明细</PanelTitle>
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">时间</th>
                  <th className="text-left px-3 py-2">类型</th>
                  <th className="text-right px-3 py-2">金额</th>
                  <th className="text-left px-3 py-2">备注</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-3 whitespace-nowrap">
                      {new Date(r.createdAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2">
                      {r.kind === "license"
                        ? "授权费"
                        : r.kind === "share"
                          ? "分账"
                          : r.kind === "withholding"
                            ? "代扣个税"
                            : "退款"}
                    </td>
                    <td
                      className={
                        "px-3 py-2 text-right tabular-nums " +
                        (r.amount >= 0 ? "text-emerald-300" : "text-rose-300")
                      }
                    >
                      {r.amount >= 0 ? "+" : ""}¥{r.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-ink-3">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          {o.status === "settled" && (
            <ReviewBlock orderId={o.id} fromUserId={u.id} role="creator_to_partner" />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
