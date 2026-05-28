import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { MCN_NAV as NAV } from "@/lib/nav";
import { pauseMCNCreator } from "@/app/actions/mcn";

export const metadata = { title: "旗下创作者" };

const STATUS_LABEL: Record<string, string> = {
  pending: "待回复",
  active: "已签约",
  paused: "已暂停",
  rejected: "已拒绝",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  active: "bg-emerald-500/15 text-emerald-300",
  paused: "bg-white/[0.08] text-ink-2",
  rejected: "bg-red-500/15 text-red-300",
};

type Search = Promise<{ ok?: string; err?: string }>;

export default async function MCNCreators({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=mcn&next=/mcn/creators");
  if (u.role !== "mcn" && u.role !== "admin") redirect("/");

  const links = db
    .select()
    .from(schema.mcnCreators)
    .where(eq(schema.mcnCreators.mcnId, u.id))
    .all();

  const monthAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const rows = links.map((l) => {
    const c = db.select().from(schema.users).where(eq(schema.users.id, l.creatorId)).get();
    const talents = db
      .select()
      .from(schema.talents)
      .where(eq(schema.talents.creatorId, l.creatorId))
      .all();
    const revs = db
      .select()
      .from(schema.revenues)
      .where(and(eq(schema.revenues.creatorId, l.creatorId)))
      .all();
    let monthCut = 0;
    for (const r of revs) {
      if (r.kind !== "license" && r.kind !== "share") continue;
      if (r.createdAt < monthAgo) continue;
      monthCut += Math.floor((r.amount * l.commissionPct) / 100);
    }
    return { link: l, creator: c, talentCount: talents.length, monthCut };
  });

  return (
    <DashboardShell role={`MCN · ${u.nickname}`} nav={NAV}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[15px] font-semibold">旗下创作者 · 共 {rows.length}</div>
        <Link
          href="/mcn/creators/invite"
          className="rounded-md px-4 py-2 text-[13px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
        >
          + 邀请创作者
        </Link>
      </div>

      {sp.ok === "invited" && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
          邀请已发出 · 等待创作者回应
        </div>
      )}
      {sp.err === "dup" && (
        <div className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-[13px] text-amber-300">
          已存在签约 / 邀请关系,请勿重复发起
        </div>
      )}

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          还没有签约任何创作者 · 去「邀请创作者」发起第一笔签约。
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[680px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">创作者</th>
                <th className="px-5 py-3 font-medium">入库形象数</th>
                <th className="px-5 py-3 font-medium">当月分账</th>
                <th className="px-5 py-3 font-medium">抽成 %</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.link.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-ink">{r.creator?.nickname ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-2">{r.talentCount}</td>
                  <td className="px-5 py-3 text-ink">¥{r.monthCut.toLocaleString()}</td>
                  <td className="px-5 py-3 text-ink-2">{r.link.commissionPct}%</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] " + (STATUS_TONE[r.link.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[r.link.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {(r.link.status === "active" || r.link.status === "paused") && (
                      <form action={pauseMCNCreator} className="inline">
                        <input type="hidden" name="id" value={r.link.id} />
                        <button className="rounded-md px-3 py-1 text-[12px] bg-white/[0.06] text-ink-2 hover:text-ink">
                          {r.link.status === "active" ? "暂停" : "恢复"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10">
        <PanelTitle>MCN 抽成模型</PanelTitle>
        <div className="glass rounded-[14px] p-5 text-[13.5px] text-ink-2 leading-7">
          MCN 抽成嵌入到 Mira 的分账层。每一笔签约创作者产生的授权费 + 发行分账,平台自动按你设定的 commissionPct 划账给 MCN。
          KOC 看到的是「净分账 + MCN 抽成」两栏,完全透明。退款 / 个税代扣不在抽成范围内。
        </div>
      </div>
    </DashboardShell>
  );
}
