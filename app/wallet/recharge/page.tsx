import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { rechargeWallet } from "@/app/actions/wallet";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "钱包充值" };

const loadSearch = createLoader({ err: parseAsString });

const TIERS = [
  { value: 100, label: "¥100", sub: "小试" },
  { value: 500, label: "¥500", sub: "常用" },
  { value: 2000, label: "¥2,000", sub: "团队" },
  { value: 10000, label: "¥10,000", sub: "工作室" },
];

const CHANNELS: { value: "wechat" | "alipay" | "bank"; label: string; sub: string }[] = [
  { value: "wechat", label: "微信支付", sub: "扫码即付" },
  { value: "alipay", label: "支付宝", sub: "扫码即付" },
  { value: "bank", label: "银行卡", sub: "对公汇款" },
];

export default async function RechargePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/wallet/recharge");
  const sp = await loadSearch(searchParams);

  return (
    <section className="container-page py-10 md:py-14">
      <Link href="/wallet" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回钱包
      </Link>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">充值</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        选择金额与支付通道,本环境为模拟支付,提交后即视为充值成功并立即上链记账。
      </p>

      {sp.err && (
        <div className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-[13px] text-rose-300">
          {sp.err === "amount" ? "金额无效" : "请重试"}
        </div>
      )}

      <form action={rechargeWallet} className="mt-6 grid gap-6 max-w-[640px]">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">金额</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIERS.map((t, i) => (
              <label
                key={t.value}
                className="cursor-pointer rounded-md border border-line bg-surface/40 px-3 py-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft transition"
              >
                <input
                  type="radio"
                  name="amount"
                  value={t.value}
                  defaultChecked={i === 1}
                  className="sr-only"
                />
                <div className="text-[15px] font-semibold">{t.label}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{t.sub}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">通道</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CHANNELS.map((c, i) => (
              <label
                key={c.value}
                className="cursor-pointer rounded-md border border-line bg-surface/40 px-3 py-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft transition"
              >
                <input
                  type="radio"
                  name="channel"
                  value={c.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <div className="text-[14px] font-medium">{c.label}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{c.sub}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-line-2 bg-white/[0.03] p-4">
          <div className="text-[12px] text-ink-3 mb-2">模拟支付二维码</div>
          <svg width="120" height="120" viewBox="0 0 21 21" className="rounded-sm bg-white">
            {Array.from({ length: 21 }).map((_, y) =>
              Array.from({ length: 21 }).map((__, x) => {
                const bit = ((x * 31 + y * 17) ^ (x + y * 3)) & 1;
                if (!bit) return null;
                return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0A0A14" />;
              })
            )}
          </svg>
          <div className="mt-2 text-[12px] text-ink-4">
            扫码后系统自动确认入账 · 实际环境为真实支付通道
          </div>
        </div>

        <button
          type="submit"
          className="justify-self-start rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
        >
          我已支付(模拟)
        </button>
      </form>
    </section>
  );
}
