import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle, StatTile } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { markDistributionLive, repushDistribution } from "@/app/actions/distributions";

export const metadata = { title: "大厂分发" };

const CHANNEL_LABEL: Record<string, string> = {
  hongguo: "红果短剧",
  douyin: "抖音",
  kuaishou: "快手",
  videoaccount: "视频号",
};
const STATUS_LABEL: Record<string, string> = {
  queued: "待推送",
  pushed: "已推送",
  live: "已上线",
  rejected: "已驳回",
};
const STATUS_TONE: Record<string, string> = {
  queued: "bg-amber-500/15 text-amber-300",
  pushed: "bg-sky-500/15 text-sky-300",
  live: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
};

export default async function AdminDistributions() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/distributions");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({ d: schema.distributions, o: schema.orders, t: schema.talents })
    .from(schema.distributions)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.distributions.orderId))
    .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
    .orderBy(desc(schema.distributions.createdAt))
    .all();

  const cnt = { live: 0, pushed: 0, queued: 0, rejected: 0 };
  for (const { d } of rows) {
    if (d.status === "live") cnt.live++;
    else if (d.status === "pushed") cnt.pushed++;
    else if (d.status === "rejected") cnt.rejected++;
    else cnt.queued++;
  }

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="已上线" value={String(cnt.live)} sub="渠道侧 publish 完成" />
        <StatTile label="已推送" value={String(cnt.pushed)} sub="等待渠道审核" />
        <StatTile label="待推送" value={String(cnt.queued)} sub="制作方未操作" />
        <StatTile label="已驳回" value={String(cnt.rejected)} sub="可重推" />
      </div>

      <PanelTitle hint={`共 ${rows.length} 条`}>分发列表</PanelTitle>
      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          暂无分发记录 · 订单交付后会自动产生
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium">订单</th>
                <th className="px-4 py-3 font-medium">形象</th>
                <th className="px-4 py-3 font-medium">渠道</th>
                <th className="px-4 py-3 font-medium">外部 ID</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ d, o, t }) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{o?.projectName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{t?.stageName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{CHANNEL_LABEL[d.channel]}</td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-[11.5px]">{d.externalRefId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[11.5px] " +
                        (STATUS_TONE[d.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[d.status]}
                    </span>
                    {d.rejectReason && (
                      <div className="text-[11px] text-red-300 mt-1">{d.rejectReason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1.5">
                      {d.status === "pushed" && (
                        <form action={markDistributionLive} className="inline">
                          <input type="hidden" name="id" value={d.id} />
                          <button className="rounded-md px-2.5 py-1 text-[12px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25">
                            标记上线
                          </button>
                        </form>
                      )}
                      {(d.status === "rejected" || d.status === "queued") && (
                        <form action={repushDistribution} className="inline">
                          <input type="hidden" name="id" value={d.id} />
                          <button className="rounded-md px-2.5 py-1 text-[12px] bg-white/[0.06] text-ink-2 hover:text-ink">
                            重新入队
                          </button>
                        </form>
                      )}
                    </div>
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
