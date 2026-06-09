import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Download } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateWallet, fenToYuan, txnKindLabel, type WalletTxnKind } from "@/lib/wallet";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "我的钱包" };

const loadSearch = createLoader({ ok: parseAsString });

const KIND_TONE: Record<string, string> = {
  recharge: "bg-emerald-500/15 text-emerald-300",
  revenue_in: "bg-emerald-500/15 text-emerald-300",
  refund_in: "bg-emerald-500/15 text-emerald-300",
  order_pay: "bg-amber-500/15 text-amber-300",
  withdraw_out: "bg-rose-500/15 text-rose-300",
  fee_out: "bg-rose-500/15 text-rose-300",
  adjust: "bg-white/[0.08] text-ink-2",
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/wallet");
  const sp = await loadSearch(searchParams);
  const wallet = getOrCreateWallet(u.id);
  const txns = db
    .select()
    .from(schema.walletTxns)
    .where(eq(schema.walletTxns.walletId, wallet.id))
    .orderBy(desc(schema.walletTxns.createdAt))
    .limit(20)
    .all();

  const pendingWithdrawals = db
    .select()
    .from(schema.withdrawals)
    .where(eq(schema.withdrawals.userId, u.id))
    .orderBy(desc(schema.withdrawals.createdAt))
    .all();

  const canWithdraw = u.role === "creator" || u.role === "mcn" || u.role === "admin";

  return (
    <section className="container-page py-10 md:py-14">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-widest text-ink-3">
        <Wallet size={14} /> 我的钱包
      </div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">余额 · 流水 · 提现</h1>

      {sp.ok === "recharge" && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          充值已到账
        </div>
      )}
      {sp.ok === "withdraw" && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          提现申请已提交,等待审核
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[12px] border border-line-2 bg-gradient-to-br from-[#6E59F6]/12 to-[#FF6FB4]/8 p-5">
          <div className="text-[12px] text-ink-3 uppercase tracking-widest">当前余额</div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums">{fenToYuan(wallet.balance)}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/wallet/recharge"
              className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]"
            >
              <Plus size={13} /> 充值
            </Link>
            {canWithdraw && (
              <Link
                href="/wallet/withdraw"
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]"
              >
                <Download size={13} /> 提现
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-[12px] border border-line bg-surface/40 p-5">
          <div className="text-[12px] text-ink-3 uppercase tracking-widest">累计入账</div>
          <div className="mt-2 text-[22px] font-semibold tabular-nums text-emerald-300">
            {fenToYuan(wallet.lifetimeIn)}
          </div>
          <div className="mt-3 text-[12.5px] text-ink-3">分账 + 充值 + 退款</div>
        </div>
        <div className="rounded-[12px] border border-line bg-surface/40 p-5">
          <div className="text-[12px] text-ink-3 uppercase tracking-widest">累计出账</div>
          <div className="mt-2 text-[22px] font-semibold tabular-nums text-rose-300">
            {fenToYuan(wallet.lifetimeOut)}
          </div>
          <div className="mt-3 text-[12.5px] text-ink-3">订单支付 + 提现</div>
        </div>
      </div>

      {pendingWithdrawals.some((w) => w.status === "pending" || w.status === "approved") && (
        <div className="mt-8">
          <div className="text-[13px] font-medium text-ink-2 mb-2">提现申请</div>
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">时间</th>
                  <th className="text-left px-3 py-2">金额</th>
                  <th className="text-left px-3 py-2">通道</th>
                  <th className="text-left px-3 py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((w) => (
                  <tr key={w.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-3">
                      {new Date(w.createdAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fenToYuan(w.amount)}</td>
                    <td className="px-3 py-2">{w.channel}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11.5px] " +
                          (w.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : w.status === "approved"
                              ? "bg-sky-500/15 text-sky-300"
                              : w.status === "rejected"
                                ? "bg-rose-500/15 text-rose-300"
                                : "bg-amber-500/15 text-amber-300")
                        }
                      >
                        {w.status === "paid"
                          ? "已打款"
                          : w.status === "approved"
                            ? "已批准"
                            : w.status === "rejected"
                              ? "被拒"
                              : "待审核"}
                      </span>
                      {w.status === "rejected" && w.reason && (
                        <span className="ml-2 text-ink-4">{w.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="text-[13px] font-medium text-ink-2 mb-2">最近 20 条流水</div>
        {txns.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            暂无流水 · 试试先充值或下单
          </div>
        ) : (
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[680px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">时间</th>
                  <th className="text-left px-3 py-2">类型</th>
                  <th className="text-right px-3 py-2">金额</th>
                  <th className="text-left px-3 py-2">备注</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((tx) => (
                  <tr key={tx.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-3 whitespace-nowrap">
                      {new Date(tx.createdAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] " +
                          (KIND_TONE[tx.kind] ?? "bg-white/[0.08] text-ink-2")
                        }
                      >
                        {tx.amount >= 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {txnKindLabel(tx.kind as WalletTxnKind)}
                      </span>
                    </td>
                    <td
                      className={
                        "px-3 py-2 text-right tabular-nums " +
                        (tx.amount >= 0 ? "text-emerald-300" : "text-rose-300")
                      }
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {fenToYuan(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-ink-3">{tx.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10 text-[12.5px] text-ink-4 leading-6">
        钱包余额以分(¥0.01)为单位精确记账,每笔流水均独立写入 mira-chain 上链。提现 / 充值通道为原型 mock,真实环境会接入银联 / 微信支付 / 支付宝。
      </div>
    </section>
  );
}
