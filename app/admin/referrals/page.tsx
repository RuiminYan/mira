import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "邀请关系" };

const STATUS_LABEL: Record<string, string> = {
  pending: "未触发",
  redeemed: "已发放",
  expired: "已过期",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  redeemed: "bg-emerald-500/15 text-emerald-300",
  expired: "bg-white/[0.08] text-ink-3",
};

export default async function AdminReferralsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/referrals");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({
      r: schema.referrals,
      refName: schema.users.nickname,
    })
    .from(schema.referrals)
    .leftJoin(schema.users, eq(schema.users.id, schema.referrals.referrerId))
    .orderBy(desc(schema.referrals.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${rows.length} 条`}>邀请关系</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">时间</th>
              <th className="text-left px-3 py-2">邀请人</th>
              <th className="text-left px-3 py-2">邀请码</th>
              <th className="text-left px-3 py-2">被邀请用户</th>
              <th className="text-left px-3 py-2">奖励</th>
              <th className="text-left px-3 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-3">
                  暂无邀请关系
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.r.id} className="border-t border-line">
                <td className="px-3 py-2 text-ink-3 whitespace-nowrap">
                  {new Date(row.r.createdAt * 1000).toLocaleString("zh-CN")}
                </td>
                <td className="px-3 py-2">{row.refName}</td>
                <td className="px-3 py-2 font-mono">{row.r.inviteCode}</td>
                <td className="px-3 py-2">
                  {row.r.inviteeId ? `#${row.r.inviteeId}` : row.r.inviteeEmail ?? "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">{row.r.rewardCredits} credits</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11.5px] " + (STATUS_TONE[row.r.status] ?? "")
                    }
                  >
                    {STATUS_LABEL[row.r.status] ?? row.r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
