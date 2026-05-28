import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { inviteCodeFor } from "@/lib/referral";

export const metadata = { title: "邀请好友" };

export default async function MyInvitePage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/invite");

  const code = inviteCodeFor(u.id);
  const link = `/login?ref=${code}`;

  const mine = db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerId, u.id))
    .orderBy(desc(schema.referrals.createdAt))
    .all();

  const redeemed = mine.filter((m) => m.status === "redeemed").length;
  const pending = mine.filter((m) => m.status === "pending").length;

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">我的邀请</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">邀请好友 · 双方得奖励</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        把你的邀请链接发给朋友:他们完成首笔订单后,你将获得 100 credits 奖励到 AI 工坊。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[12px] border border-line-2 bg-gradient-to-br from-[#6E59F6]/12 to-[#FF6FB4]/8 p-5">
          <div className="text-[12px] uppercase tracking-widest text-ink-3">我的邀请码</div>
          <div className="mt-2 font-mono text-[24px] tracking-wider text-ink select-all">{code}</div>
          <div className="mt-4 text-[12.5px] text-ink-3">分享链接(复制即用)</div>
          <code className="block mt-1 break-all rounded-md bg-white/[0.04] px-3 py-2 text-[12.5px] font-mono text-ink">
            {link}
          </code>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[12px] border border-line bg-surface/40 p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3">已成功邀请</div>
            <div className="mt-1 text-[24px] font-semibold tabular-nums">{redeemed}</div>
            <div className="text-[12.5px] text-ink-3 mt-1">累计奖励 {redeemed * 100} credits</div>
          </div>
          <div className="rounded-[12px] border border-line bg-surface/40 p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3">注册待触发</div>
            <div className="mt-1 text-[24px] font-semibold tabular-nums">{pending}</div>
            <div className="text-[12.5px] text-ink-3 mt-1">对方完成首单即生效</div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="text-[13px] font-medium text-ink-2 mb-2">邀请历史</div>
        {mine.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            还没有人通过你的邀请码注册
          </div>
        ) : (
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">时间</th>
                  <th className="text-left px-3 py-2">被邀请用户</th>
                  <th className="text-left px-3 py-2">奖励</th>
                  <th className="text-left px-3 py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-3">
                      {new Date(r.createdAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2">#{r.inviteeId ?? "—"}</td>
                    <td className="px-3 py-2">{r.rewardCredits} credits</td>
                    <td className="px-3 py-2">
                      {r.status === "redeemed" ? "已发放" : r.status === "pending" ? "待触发" : "已过期"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
