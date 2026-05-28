import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { MCN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "MCN 后台" };

export default async function MCNHome() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=mcn&next=/mcn");
  if (u.role !== "mcn" && u.role !== "admin") redirect("/");

  const links = db
    .select()
    .from(schema.mcnCreators)
    .where(and(eq(schema.mcnCreators.mcnId, u.id), eq(schema.mcnCreators.status, "active")))
    .all();
  const creatorIds = links.map((l) => l.creatorId);

  let totalGmv = 0;
  let myCut = 0;
  const monthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  let monthShare = 0;

  if (creatorIds.length > 0) {
    const talents = db
      .select()
      .from(schema.talents)
      .where(inArray(schema.talents.creatorId, creatorIds))
      .all();
    const talentIds = talents.map((t) => t.id);
    if (talentIds.length > 0) {
      const orders = db
        .select()
        .from(schema.orders)
        .where(inArray(schema.orders.talentId, talentIds))
        .all();
      totalGmv = orders.reduce((a, o) => a + o.amount, 0);
    }

    const revs = db
      .select()
      .from(schema.revenues)
      .where(inArray(schema.revenues.creatorId, creatorIds))
      .all();
    for (const r of revs) {
      if (r.kind !== "license" && r.kind !== "share") continue;
      const link = links.find((l) => l.creatorId === r.creatorId);
      if (!link) continue;
      const cut = Math.floor((r.amount * link.commissionPct) / 100);
      myCut += cut;
      if (r.createdAt >= monthAgo) monthShare += cut;
    }
  }

  const pendingInvites = db
    .select()
    .from(schema.mcnCreators)
    .where(and(eq(schema.mcnCreators.mcnId, u.id), eq(schema.mcnCreators.status, "pending")))
    .all();

  return (
    <DashboardShell role={`MCN · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="旗下创作者" value={String(links.length)} sub="已签约" />
        <StatTile label="累计旗下 GMV" value={`¥${totalGmv.toLocaleString()}`} sub="所有授权费合计" />
        <StatTile label="我的累计分账" value={`¥${myCut.toLocaleString()}`} sub="抽成派生" />
        <StatTile label="近 30 天分账" value={`¥${monthShare.toLocaleString()}`} sub="月度滚动" />
      </div>

      <div className="mb-10">
        <PanelTitle hint={`${pendingInvites.length} 个待回复`}>待回复邀请</PanelTitle>
        {pendingInvites.length === 0 ? (
          <div className="glass rounded-[14px] p-6 text-[13.5px] text-ink-3">
            目前没有待回复邀请 · 在「邀请创作者」发起新签约。
          </div>
        ) : (
          <div className="glass rounded-[14px] divide-y divide-line">
            {pendingInvites.map((p) => {
              const c = db.select().from(schema.users).where(eq(schema.users.id, p.creatorId)).get();
              return (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[13.5px] text-ink">{c?.nickname ?? "—"}</div>
                    <div className="text-[11px] text-ink-3">{c?.email ?? ""} · 抽成 {p.commissionPct}%</div>
                  </div>
                  <span className="text-[12px] text-amber-300">待创作者回复</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
