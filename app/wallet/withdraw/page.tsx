import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateWallet, fenToYuan } from "@/lib/wallet";
import { submitWithdrawal } from "@/app/actions/wallet";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "提现申请" };

const loadSearch = createLoader({ err: parseAsString });

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/wallet/withdraw");
  if (u.role !== "creator" && u.role !== "mcn" && u.role !== "admin")
    redirect("/wallet?err=role");
  const sp = await loadSearch(searchParams);
  const w = getOrCreateWallet(u.id);

  return (
    <section className="container-page py-10 md:py-14">
      <Link href="/wallet" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回钱包
      </Link>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">提现</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        可提现余额 <span className="text-ink font-medium">{fenToYuan(w.balance)}</span>。提交后金额立即冻结,等待管理员审核与打款,审核通常 T+1。
      </p>

      {sp.err && (
        <div className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-[13px] text-rose-300">
          {sp.err === "min"
            ? "金额低于 ¥10"
            : sp.err === "balance"
              ? "余额不足"
              : sp.err === "fields"
                ? "请补全收款信息"
                : "请重试"}
        </div>
      )}

      <form action={submitWithdrawal} className="mt-6 grid gap-5 max-w-[600px]">
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">金额(元)</span>
          <input
            name="amount"
            type="number"
            min="10"
            step="0.01"
            required
            placeholder="例如 200"
            className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px]"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">通道</span>
          <select
            name="channel"
            className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px]"
          >
            <option value="bank">银行卡</option>
            <option value="wechat">微信零钱</option>
            <option value="alipay">支付宝</option>
          </select>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-[12px] uppercase tracking-widest text-ink-3">收款人</span>
            <input
              name="accountName"
              required
              placeholder="持卡人 / 收款人"
              className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px]"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] uppercase tracking-widest text-ink-3">账号</span>
            <input
              name="accountNo"
              required
              placeholder="卡号 / 微信 / 支付宝 ID"
              className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px]"
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">开户行(仅银行卡)</span>
          <input
            name="bankName"
            placeholder="例如 招商银行 上海分行"
            className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px]"
          />
        </label>

        <button
          type="submit"
          className="justify-self-start rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
        >
          提交提现申请
        </button>
      </form>
    </section>
  );
}
