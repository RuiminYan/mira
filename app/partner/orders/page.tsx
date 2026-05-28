import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardLayout";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "我的订单" };

const NAV = [
  { href: "/partner", label: "概览" },
  { href: "/partner/orders", label: "我的订单" },
  { href: "/partner/quotes", label: "议价工作台" },
  { href: "/marketplace", label: "选角广场 →" },
];

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
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  paid: "bg-sky-500/15 text-sky-300",
  approved: "bg-sky-500/15 text-sky-300",
  delivered: "bg-indigo-500/15 text-indigo-300",
  settled: "bg-emerald-500/15 text-emerald-300",
  disputed: "bg-red-500/15 text-red-300",
  refunded: "bg-white/[0.08] text-ink-2",
  cancelled: "bg-white/[0.08] text-ink-2",
};

type Search = Promise<{ ok?: string }>;

export default async function PartnerOrders({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/orders");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");

  const rows = db
    .select({ o: schema.orders, talentName: schema.talents.stageName, cover: schema.talents.cover })
    .from(schema.orders)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
    .where(eq(schema.orders.partnerId, u.id))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      {sp.ok && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
          <CheckCircle2 size={14} /> 订单已提交 · 编号 #{sp.ok}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-[15px] font-semibold">订单列表 · 共 {rows.length}</div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
        >
          + 新下单
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          还没有订单 · 去选角广场挑一张脸开始。
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">演员</th>
                <th className="px-5 py-3 font-medium">场景</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">分账</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ o, talentName, cover }) => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <Link href={`/partner/orders/${o.id}`} className="text-ink hover:text-brand-2">
                      {o.projectName}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/marketplace/${o.talentId}`}
                      className="inline-flex items-center gap-2 hover:text-ink text-ink-2"
                    >
                      <div className="h-7 w-7 rounded-md" style={{ background: cover ?? "#222" }} />
                      {talentName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-2">{o.scope}</td>
                  <td className="px-5 py-3 text-ink">¥{o.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-ink-2">{o.share}%</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] " +
                        (STATUS_TONE[o.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {o.status === "pending" ? (
                      <Link
                        href={`/partner/orders/${o.id}/pay`}
                        className="rounded-md px-3 py-1 text-[12px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
                      >
                        去支付
                      </Link>
                    ) : (
                      <Link
                        href={`/partner/orders/${o.id}`}
                        className="rounded-md px-3 py-1 text-[12px] text-ink-2 bg-white/[0.06] hover:bg-white/[0.1]"
                      >
                        详情
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
