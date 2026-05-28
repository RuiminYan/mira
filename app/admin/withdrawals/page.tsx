import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { approveWithdrawal, markWithdrawalPaid, rejectWithdrawal } from "@/app/actions/wallet";
import { fenToYuan } from "@/lib/wallet";

export const metadata = { title: "提现审核" };

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-sky-500/15 text-sky-300",
  paid: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-300",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "待审核",
  approved: "已批准 · 待打款",
  paid: "已打款",
  rejected: "已驳回",
};

export default async function AdminWithdrawalsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/withdrawals");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({ w: schema.withdrawals, name: schema.users.nickname, email: schema.users.email })
    .from(schema.withdrawals)
    .leftJoin(schema.users, eq(schema.users.id, schema.withdrawals.userId))
    .orderBy(desc(schema.withdrawals.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${rows.length} 笔`}>提现申请</PanelTitle>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
          暂无提现申请
        </div>
      ) : (
        <div className="rounded-md border border-line overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="bg-white/[0.04] text-ink-3">
              <tr>
                <th className="text-left px-3 py-2">时间</th>
                <th className="text-left px-3 py-2">用户</th>
                <th className="text-right px-3 py-2">金额</th>
                <th className="text-left px-3 py-2">通道 / 账户</th>
                <th className="text-left px-3 py-2">状态</th>
                <th className="text-left px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const acc = safeParse(r.w.accountInfo);
                return (
                  <tr key={r.w.id} className="border-t border-line align-top">
                    <td className="px-3 py-2 text-ink-3 whitespace-nowrap">
                      {new Date(r.w.createdAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11.5px] text-ink-4">{r.email}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fenToYuan(r.w.amount)}</td>
                    <td className="px-3 py-2 text-ink-3">
                      <div>{labelChannel(r.w.channel)}</div>
                      <div className="text-[11.5px]">
                        {acc.accountName} · {mask(acc.accountNo)}
                        {acc.bankName ? ` · ${acc.bankName}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11.5px] " + (STATUS_TONE[r.w.status] ?? "bg-white/[0.08]")
                        }
                      >
                        {STATUS_LABEL[r.w.status] ?? r.w.status}
                      </span>
                      {r.w.reason && (
                        <div className="text-[11.5px] text-ink-4 mt-1">{r.w.reason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.w.status === "pending" && (
                        <div className="flex flex-wrap gap-2">
                          <form action={approveWithdrawal}>
                            <input type="hidden" name="id" value={r.w.id} />
                            <button className="rounded-md bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 px-2.5 py-1 text-[12px]">
                              批准
                            </button>
                          </form>
                          <form action={rejectWithdrawal} className="inline-flex items-center gap-1">
                            <input type="hidden" name="id" value={r.w.id} />
                            <input
                              type="text"
                              name="reason"
                              placeholder="拒绝理由"
                              className="w-24 rounded-md bg-bg/40 border border-line px-2 py-1 text-[11.5px]"
                            />
                            <button className="rounded-md bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 px-2.5 py-1 text-[12px]">
                              驳回
                            </button>
                          </form>
                        </div>
                      )}
                      {r.w.status === "approved" && (
                        <form action={markWithdrawalPaid}>
                          <input type="hidden" name="id" value={r.w.id} />
                          <button className="rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-2.5 py-1 text-[12px]">
                            标记已打款
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

function safeParse(s: string): { accountName?: string; accountNo?: string; bankName?: string; channel?: string } {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
function mask(s: string | undefined): string {
  if (!s) return "";
  if (s.length <= 4) return s;
  return s.slice(0, 2) + "****" + s.slice(-4);
}
function labelChannel(c: string): string {
  if (c === "bank") return "银行卡";
  if (c === "wechat") return "微信零钱";
  if (c === "alipay") return "支付宝";
  return c;
}
