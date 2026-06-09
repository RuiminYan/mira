import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import { respondMCNInvite } from "@/app/actions/mcn";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "我的经纪人" };

const loadSearch = createLoader({
  ok: parseAsString,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "待回复",
  active: "已签约",
  paused: "已暂停",
  rejected: "已拒绝",
};

export default async function CreatorMCN({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await loadSearch(searchParams);
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/mcn");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const links = db
    .select()
    .from(schema.mcnCreators)
    .where(eq(schema.mcnCreators.creatorId, u.id))
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
          已处理
        </div>
      )}

      <PanelTitle>我的经纪人(MCN)</PanelTitle>
      {links.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          目前没有签约 MCN · 收到邀请会在这里出现
        </div>
      ) : (
        <div className="grid gap-3">
          {links.map((l) => {
            const m = db.select().from(schema.users).where(eq(schema.users.id, l.mcnId)).get();
            return (
              <div key={l.id} className="glass rounded-[14px] p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-ink">{m?.nickname ?? "未知 MCN"}</div>
                  <div className="text-[12px] text-ink-3 mt-1">
                    抽成 {l.commissionPct}% · 状态 {STATUS_LABEL[l.status]}
                  </div>
                </div>
                {l.status === "pending" && (
                  <div className="flex gap-2">
                    <form action={respondMCNInvite} className="inline">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="action" value="accept" />
                      <button className="rounded-md px-4 py-1.5 text-[13px] bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white">
                        接受
                      </button>
                    </form>
                    <form action={respondMCNInvite} className="inline">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button className="rounded-md px-4 py-1.5 text-[13px] bg-white/[0.06] text-ink-2 hover:text-ink">
                        拒绝
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 glass rounded-[14px] p-5 text-[13.5px] text-ink-2 leading-7">
        MCN 抽成是「平台自动派生」逻辑。MCN 不参与你的脸资产合约,也无法决定你的接单。
        你的每一笔授权费 + 分账,平台会按 commissionPct 自动划账给 MCN。
        想终止合作 → 在右上角进入 /creator/mcn 暂停或拒绝。
      </div>
    </DashboardShell>
  );
}
