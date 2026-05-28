import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "我的形象" };

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  review: "审核中",
  live: "已上架",
  taken_down: "已下架",
};
const STATUS_TONE: Record<string, string> = {
  draft: "bg-white/[0.06] text-ink-2",
  review: "bg-amber-500/15 text-amber-300",
  live: "bg-emerald-500/15 text-emerald-300",
  taken_down: "bg-red-500/15 text-red-300",
};

export default async function MyTalents() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/talents");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const list = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.creatorId, u.id))
    .orderBy(desc(schema.talents.createdAt))
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[15px] font-semibold">我的形象 · 共 {list.length}</div>
        <Link
          href="/creator/talents/new"
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
        >
          + 上传新形象
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          还没有形象,从「上传新形象」开始。
        </div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">形象</th>
                <th className="px-5 py-3 font-medium">标签</th>
                <th className="px-5 py-3 font-medium">起拍 / 分账</th>
                <th className="px-5 py-3 font-medium">等级</th>
                <th className="px-5 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <Link href={`/creator/talents/${t.id}`} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md" style={{ background: t.cover }} />
                      <div>
                        <div className="text-ink font-medium">{t.stageName}</div>
                        <div className="text-[12px] text-ink-3">
                          {t.gender === "female" ? "女" : t.gender === "male" ? "男" : "中性"} ·{" "}
                          {t.ageBand}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-2">
                    <div className="flex flex-wrap gap-1">
                      {t.styleTags
                        .split(",")
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/[0.06] text-ink-2 text-[11px] px-2 py-0.5"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-ink">¥{t.priceOnce.toLocaleString()}</div>
                    <div className="text-[12px] text-ink-3">分账 {t.revenueShare}%</div>
                  </td>
                  <td className="px-5 py-3 text-ink">
                    {t.grade} {t.exclusive ? "· 独家" : ""}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] " +
                        (STATUS_TONE[t.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
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
