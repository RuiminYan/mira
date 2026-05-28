import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { MCN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "我的分账" };

export default async function MCNRevenue() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=mcn&next=/mcn/revenue");
  if (u.role !== "mcn" && u.role !== "admin") redirect("/");

  const links = db
    .select()
    .from(schema.mcnCreators)
    .where(eq(schema.mcnCreators.mcnId, u.id))
    .all();
  const cutByCreator = new Map<number, number>(links.map((l) => [l.creatorId, l.commissionPct]));
  const creatorIds = links
    .filter((l) => l.status === "active" || l.status === "paused")
    .map((l) => l.creatorId);

  const revs =
    creatorIds.length === 0
      ? []
      : db
          .select()
          .from(schema.revenues)
          .where(inArray(schema.revenues.creatorId, creatorIds))
          .orderBy(desc(schema.revenues.createdAt))
          .all();

  let totalCut = 0;
  let month = 0;
  const monthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const rows: {
    id: number;
    creatorName: string;
    project: string;
    base: number;
    cut: number;
    kind: string;
    createdAt: number;
  }[] = [];
  for (const r of revs) {
    if (r.kind !== "license" && r.kind !== "share") continue;
    const pct = cutByCreator.get(r.creatorId) ?? 0;
    const cut = Math.floor((r.amount * pct) / 100);
    if (cut === 0) continue;
    totalCut += cut;
    if (r.createdAt >= monthAgo) month += cut;
    const c = db.select().from(schema.users).where(eq(schema.users.id, r.creatorId)).get();
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, r.orderId)).get();
    rows.push({
      id: r.id,
      creatorName: c?.nickname ?? "—",
      project: o?.projectName ?? "—",
      base: r.amount,
      cut,
      kind: r.kind === "license" ? "授权费" : "分账",
      createdAt: r.createdAt,
    });
  }

  return (
    <DashboardShell role={`MCN · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="累计抽成" value={`¥${totalCut.toLocaleString()}`} sub="所有签约创作者合计" />
        <StatTile label="近 30 天" value={`¥${month.toLocaleString()}`} sub="月度滚动" />
        <StatTile label="签约创作者" value={String(creatorIds.length)} sub="active + paused" />
        <StatTile label="抽成笔数" value={String(rows.length)} sub="所有有效抽成事件" />
      </div>

      <PanelTitle>分账抽成流水</PanelTitle>
      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          暂无抽成流水 · 旗下创作者完成订单后会出现在这里。
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">创作者</th>
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium text-right">原金额</th>
                <th className="px-5 py-3 font-medium text-right">我抽成</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{r.creatorName}</td>
                  <td className="px-5 py-3 text-ink-2">{r.project}</td>
                  <td className="px-5 py-3 text-ink-2">{r.kind}</td>
                  <td className="px-5 py-3 text-ink-2 text-right">¥{r.base.toLocaleString()}</td>
                  <td className="px-5 py-3 text-ink text-right">+¥{r.cut.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
