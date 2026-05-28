import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { QrCode, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { payOrder } from "@/app/actions/orders";

export const metadata = { title: "扫码支付" };

function FakeQR({ seed }: { seed: number }) {
  const N = 25;
  const cells: boolean[] = [];
  let x = seed * 2654435761;
  for (let i = 0; i < N * N; i++) {
    x = (x * 16807 + 1) >>> 0;
    cells.push((x & 1) === 1);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const r = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        cells[(cy + dy) * N + (cx + dx)] = r || inner;
      }
    }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);

  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="w-44 h-44 rounded-md bg-white p-1.5">
      {cells.map((c, i) => {
        if (!c) return null;
        const cx = i % N;
        const cy = Math.floor(i / N);
        return <rect key={i} x={cx} y={cy} width={1} height={1} fill="#15172A" />;
      })}
    </svg>
  );
}

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const u = await getCurrentUser();
  if (!u) redirect(`/login?role=partner&next=/partner/orders/${id}/pay`);

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  if (!o) notFound();
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");
  if (o.status !== "pending") redirect(`/partner/orders/${id}`);

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();

  return (
    <section className="container-page py-12 md:py-16">
      <Link href={`/partner/orders/${id}`} className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回订单详情
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="glass rounded-[16px] p-7">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2 inline-flex items-center gap-2">
            <QrCode size={14} /> 扫码支付(模拟)
          </div>
          <h1 className="text-[24px] font-semibold leading-tight mb-5">
            支付 <span className="text-gradient">¥{o.amount.toLocaleString()}</span>
          </h1>

          <div className="flex flex-wrap gap-6 items-start">
            <FakeQR seed={o.id} />
            <div className="text-[13px] text-ink-2 leading-7 max-w-xs">
              <div className="mb-2">渠道:微信支付 / 支付宝</div>
              <div className="mb-2">订单编号 #{o.id}</div>
              <div className="font-mono text-ink-3 text-[12px] break-all">
                合同 SHA256 已上链,支付成功后自动写入支付存证
              </div>
            </div>
          </div>

          <form action={payOrder} className="mt-7 grid gap-3 max-w-sm">
            <input type="hidden" name="orderId" value={o.id} />
            <label className="grid gap-1.5">
              <span className="text-[12px] text-ink-3 uppercase tracking-widest">支付渠道</span>
              <select
                name="channel"
                defaultValue="wechat"
                className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px] text-ink"
              >
                <option value="wechat">微信支付</option>
                <option value="alipay">支付宝</option>
                <option value="balance">平台余额</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[12px] text-ink-3 uppercase tracking-widest">优惠券码(可选)</span>
              <input
                name="coupon"
                placeholder="如 WELCOME10"
                className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px] text-ink font-mono"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
            >
              我已支付 (模拟)
            </button>
            <p className="text-[12px] text-ink-4">
              本环境为演示原型,点击后会模拟支付成功并把订单状态推进到「已支付」。
            </p>
          </form>
        </div>

        <div className="grid gap-4 h-fit">
          <div className="glass rounded-[14px] p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
              <ShieldCheck size={14} /> 订单摘要
            </div>
            <div className="grid gap-2 text-[13px]">
              <Row label="项目" value={o.projectName} />
              <Row label="形象" value={t?.stageName ?? "—"} />
              <Row label="授权场景" value={o.scope} />
              <Row label="基础授权费" value={`¥${o.amount.toLocaleString()}`} />
              <Row label="分账比例" value={`${o.share}%`} />
            </div>
          </div>
          <CountDownTip />
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line last:border-0 pb-2 last:pb-0">
      <div className="text-ink-3">{label}</div>
      <div className="text-ink text-right break-all">{value}</div>
    </div>
  );
}

function CountDownTip() {
  return (
    <div className="glass rounded-[14px] p-5 text-[12.5px] text-ink-3 leading-6">
      <div className="text-ink text-[13px] font-medium mb-1.5">支付窗口 15:00</div>
      二维码模拟有效期为 15 分钟,超时请刷新页面。
      <br />
      支付完成后,订单自动进入「已支付」状态,平台 24h 内审核后进入「已批准」。
    </div>
  );
}
