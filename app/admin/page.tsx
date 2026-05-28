import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { updateOrderStatus } from "@/app/actions/orders";
import { approveTalent } from "@/app/actions/talents";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "管理后台" };

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

export default async function AdminHome() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin");
  if (u.role !== "admin") redirect("/");

  const userCount = db.select({ c: sql<number>`count(*)` }).from(schema.users).get();
  const creatorCount = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.users)
    .where(eq(schema.users.role, "creator"))
    .get();
  const talentCount = db.select({ c: sql<number>`count(*)` }).from(schema.talents).get();
  const orderTotal = db
    .select({ s: sql<number>`coalesce(sum(${schema.orders.amount}), 0)` })
    .from(schema.orders)
    .get();
  const orderCount = db.select({ c: sql<number>`count(*)` }).from(schema.orders).get();

  const orders = db
    .select({ o: schema.orders, talentName: schema.talents.stageName, partnerName: schema.users.nickname })
    .from(schema.orders)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
    .leftJoin(schema.users, eq(schema.users.id, schema.orders.partnerId))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const leads = db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(12).all();

  const pendingTalents = db
    .select({ t: schema.talents, creatorName: schema.users.nickname })
    .from(schema.talents)
    .leftJoin(schema.users, eq(schema.users.id, schema.talents.creatorId))
    .where(eq(schema.talents.status, "review"))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="平台用户" value={String(userCount?.c ?? 0)} sub={`其中创作者 ${creatorCount?.c ?? 0}`} />
        <StatTile label="入库形象" value={String(talentCount?.c ?? 0)} sub="所有等级合计" />
        <StatTile label="累计订单" value={String(orderCount?.c ?? 0)} sub="全平台所有项目" />
        <StatTile label="累计 GMV" value={`¥${(orderTotal?.s ?? 0).toLocaleString()}`} sub="按订单授权费金额" />
      </div>

      {pendingTalents.length > 0 && (
        <div className="mb-10">
          <PanelTitle hint={`${pendingTalents.length} 个待审`}>新形象审核</PanelTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingTalents.map(({ t, creatorName }) => (
              <div key={t.id} className="glass rounded-[12px] p-4 flex gap-3 items-center">
                <div className="h-14 w-14 rounded-md shrink-0" style={{ background: t.cover }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-ink truncate">{t.stageName}</div>
                  <div className="text-[12px] text-ink-3 truncate">
                    {creatorName} · {t.styleTags}
                  </div>
                </div>
                <Link
                  href={`/marketplace/${t.id}`}
                  className="rounded-md px-3 py-1.5 text-[12px] bg-white/[0.06] text-ink-2 hover:text-ink"
                >
                  查看
                </Link>
                <form action={approveTalent} className="inline">
                  <input type="hidden" name="id" value={t.id} />
                  <button className="rounded-md px-3 py-1.5 text-[12px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">
                    上架并上链
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="orders" className="mb-10 scroll-mt-24">
        <PanelTitle hint={`共 ${orders.length} 单`}>订单流水</PanelTitle>
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">演员</th>
                <th className="px-5 py-3 font-medium">制作方</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(({ o, talentName, partnerName }) => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-ink">{o.projectName}</td>
                  <td className="px-5 py-3 text-ink-2">{talentName ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-2">{partnerName ?? "—"}</td>
                  <td className="px-5 py-3 text-ink">¥{o.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] " +
                        (STATUS_TONE[o.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={updateOrderStatus} className="inline-flex gap-1.5 flex-wrap justify-end">
                      <input type="hidden" name="orderId" value={o.id} />
                      {o.status === "paid" && (
                        <button
                          name="status"
                          value="approved"
                          className="rounded-md px-2.5 py-1 text-[12px] bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
                        >
                          批准
                        </button>
                      )}
                      {o.status === "approved" && (
                        <button
                          name="status"
                          value="delivered"
                          className="rounded-md px-2.5 py-1 text-[12px] bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25"
                        >
                          标记交付
                        </button>
                      )}
                      {o.status === "delivered" && (
                        <button
                          name="status"
                          value="settled"
                          className="rounded-md px-2.5 py-1 text-[12px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        >
                          结算分账
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="leads" className="scroll-mt-24">
        <PanelTitle hint={`最近 ${leads.length}`}>合作线索</PanelTitle>
        {leads.length === 0 ? (
          <div className="glass rounded-[14px] p-8 text-center text-ink-3">
            暂无线索 · 当外部表单提交后会出现在这里。
          </div>
        ) : (
          <div className="overflow-x-auto glass rounded-[14px]">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">类型</th>
                  <th className="px-5 py-3 font-medium">姓名</th>
                  <th className="px-5 py-3 font-medium">联系方式</th>
                  <th className="px-5 py-3 font-medium">留言</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink-2">
                      {l.kind === "creator" ? "创作者" : l.kind === "partner" ? "制作方" : "投资人"}
                    </td>
                    <td className="px-5 py-3 text-ink">{l.name}</td>
                    <td className="px-5 py-3 text-ink-2">{l.contact}</td>
                    <td className="px-5 py-3 text-ink-3 truncate max-w-[420px]">{l.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
