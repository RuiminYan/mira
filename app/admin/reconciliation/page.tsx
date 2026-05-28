import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle, StatTile } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "对账面板" };

type DayRow = { day: string; paymentIn: number; refund: number; share: number; withholding: number };

export default async function Reconciliation() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/reconciliation");
  if (u.role !== "admin") redirect("/");

  const payments = db
    .select({ p: schema.payments, order: schema.orders, partner: schema.users })
    .from(schema.payments)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
    .leftJoin(schema.users, eq(schema.users.id, schema.orders.partnerId))
    .orderBy(desc(schema.payments.createdAt))
    .all();

  const revenues = db.select().from(schema.revenues).all();

  const totalIn = payments
    .filter((x) => x.p.status === "succeeded")
    .reduce((a, b) => a + b.p.amount, 0);
  const totalRefund = payments
    .filter((x) => x.p.status === "refunded")
    .reduce((a, b) => a + b.p.amount, 0);
  const totalShare = revenues.filter((r) => r.kind === "share").reduce((a, b) => a + b.amount, 0);
  const totalWithholding = revenues
    .filter((r) => r.kind === "withholding")
    .reduce((a, b) => a + b.amount, 0);
  const totalLicense = revenues.filter((r) => r.kind === "license").reduce((a, b) => a + b.amount, 0);

  const dayMap = new Map<string, DayRow>();
  for (const { p } of payments) {
    const d = new Date(p.createdAt * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(key)) dayMap.set(key, { day: key, paymentIn: 0, refund: 0, share: 0, withholding: 0 });
    const row = dayMap.get(key)!;
    if (p.status === "succeeded") row.paymentIn += p.amount;
    else if (p.status === "refunded") row.refund += p.amount;
  }
  for (const r of revenues) {
    const d = new Date(r.createdAt * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(key)) dayMap.set(key, { day: key, paymentIn: 0, refund: 0, share: 0, withholding: 0 });
    const row = dayMap.get(key)!;
    if (r.kind === "share") row.share += r.amount;
    else if (r.kind === "withholding") row.withholding += r.amount;
  }
  const days = Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day));

  // Per-channel + per-partner aggregations
  const channelMap = new Map<string, { count: number; succeeded: number; refunded: number }>();
  for (const { p } of payments) {
    const k = p.channel;
    const cur = channelMap.get(k) ?? { count: 0, succeeded: 0, refunded: 0 };
    cur.count++;
    if (p.status === "succeeded") cur.succeeded += p.amount;
    if (p.status === "refunded") cur.refunded += p.amount;
    channelMap.set(k, cur);
  }

  const partnerMap = new Map<string, { count: number; amount: number }>();
  for (const { p, partner } of payments) {
    if (p.status !== "succeeded") continue;
    const name = partner?.nickname ?? `用户 ${p.orderId}`;
    const cur = partnerMap.get(name) ?? { count: 0, amount: 0 };
    cur.count++;
    cur.amount += p.amount;
    partnerMap.set(name, cur);
  }

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="支付入账" value={`¥${totalIn.toLocaleString()}`} sub="所有 succeeded 流水" />
        <StatTile label="退款支出" value={`¥${totalRefund.toLocaleString()}`} sub="争议退款" />
        <StatTile label="授权 / 分账" value={`¥${(totalLicense + totalShare).toLocaleString()}`} sub="license + share" />
        <StatTile
          label="个税代扣"
          value={`¥${Math.abs(totalWithholding).toLocaleString()}`}
          sub="20% 综合所得"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mb-10">
        <div>
          <PanelTitle hint={`${days.length} 天`}>按日趋势</PanelTitle>
          <DailyChart days={days} />
          <div className="overflow-x-auto glass rounded-[14px] mt-3">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 font-medium">日期</th>
                  <th className="px-4 py-2 font-medium text-right">入账</th>
                  <th className="px-4 py-2 font-medium text-right">退款</th>
                  <th className="px-4 py-2 font-medium text-right">分账</th>
                  <th className="px-4 py-2 font-medium text-right">代扣</th>
                  <th className="px-4 py-2 font-medium text-right">差额</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const delta = d.paymentIn - d.refund - d.share - Math.abs(d.withholding);
                  return (
                    <tr key={d.day} className="border-b border-line last:border-0">
                      <td className="px-4 py-2 text-ink">{d.day}</td>
                      <td className="px-4 py-2 text-ink-2 text-right">¥{d.paymentIn.toLocaleString()}</td>
                      <td className="px-4 py-2 text-amber-300 text-right">¥{d.refund.toLocaleString()}</td>
                      <td className="px-4 py-2 text-ink-2 text-right">¥{d.share.toLocaleString()}</td>
                      <td className="px-4 py-2 text-ink-2 text-right">¥{Math.abs(d.withholding).toLocaleString()}</td>
                      <td className={"px-4 py-2 text-right " + (delta >= 0 ? "text-emerald-300" : "text-red-300")}>
                        ¥{delta.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <PanelTitle>按渠道</PanelTitle>
          <div className="glass rounded-[14px] divide-y divide-line">
            {Array.from(channelMap.entries()).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-4 py-3">
                <div className="text-[13.5px] text-ink">{k === "wechat" ? "微信支付" : k === "alipay" ? "支付宝" : "平台余额"}</div>
                <div className="text-right">
                  <div className="text-[13px] text-ink">¥{v.succeeded.toLocaleString()}</div>
                  <div className="text-[11px] text-ink-3">{v.count} 笔 · 退款 ¥{v.refunded.toLocaleString()}</div>
                </div>
              </div>
            ))}
            {channelMap.size === 0 && <div className="px-4 py-6 text-center text-ink-3 text-[13px]">尚无渠道流水</div>}
          </div>

          <div className="mt-6">
            <PanelTitle>按制作方</PanelTitle>
            <div className="glass rounded-[14px] divide-y divide-line">
              {Array.from(partnerMap.entries())
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-3">
                    <div className="text-[13.5px] text-ink truncate">{k}</div>
                    <div className="text-right">
                      <div className="text-[13px] text-ink">¥{v.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-ink-3">{v.count} 笔</div>
                    </div>
                  </div>
                ))}
              {partnerMap.size === 0 && <div className="px-4 py-6 text-center text-ink-3 text-[13px]">尚无入账</div>}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function DailyChart({ days }: { days: DayRow[] }) {
  if (days.length === 0) {
    return (
      <div className="glass rounded-[14px] p-8 text-center text-ink-3 text-[13px]">尚无数据</div>
    );
  }
  const W = 800;
  const H = 200;
  const PAD = 28;
  const xs = days.map((_, i) => PAD + ((W - PAD * 2) * i) / Math.max(1, days.length - 1));
  const maxV = Math.max(1, ...days.map((d) => Math.max(d.paymentIn, d.refund, d.share)));
  const y = (v: number) => H - PAD - ((H - PAD * 2) * v) / maxV;

  const line = (key: keyof Pick<DayRow, "paymentIn" | "refund" | "share">) =>
    days.map((d, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y(d[key])}`).join(" ");

  return (
    <div className="glass rounded-[14px] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px]">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.15" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity="0.15" />
        <path d={line("paymentIn")} fill="none" stroke="#6E59F6" strokeWidth={2} />
        <path d={line("share")} fill="none" stroke="#22D3EE" strokeWidth={2} />
        <path d={line("refund")} fill="none" stroke="#F59E0B" strokeWidth={2} />
        {days.map((d, i) => (
          <g key={d.day}>
            <text x={xs[i]} y={H - PAD + 14} fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.6}>
              {d.day.slice(5)}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex gap-4 text-[12px] text-ink-3 mt-2 flex-wrap">
        <Legend color="#6E59F6" label="支付入账" />
        <Legend color="#22D3EE" label="分账" />
        <Legend color="#F59E0B" label="退款" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
