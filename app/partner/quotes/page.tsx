import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";

export const metadata = { title: "我的议价" };

const NAV = [
  { href: "/partner", label: "概览" },
  { href: "/partner/orders", label: "我的订单" },
  { href: "/partner/quotes", label: "议价工作台" },
  { href: "/marketplace", label: "选角广场 →" },
];

const STATUS_LABEL: Record<string, string> = {
  submitted: "已发出",
  counter: "对方还价",
  accepted: "已成交",
  rejected: "已拒绝",
  expired: "已过期",
};
const STATUS_TONE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-300",
  counter: "bg-sky-500/15 text-sky-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-white/[0.08] text-ink-3",
  expired: "bg-white/[0.08] text-ink-3",
};

export default async function PartnerQuotesPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/quotes");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");

  const list = db
    .select()
    .from(schema.quotes)
    .where(eq(schema.quotes.partnerId, u.id))
    .orderBy(desc(schema.quotes.updatedAt))
    .all();

  const groups: Record<string, typeof list> = {
    submitted: [],
    counter: [],
    accepted: [],
    rejected: [],
    expired: [],
  };
  for (const q of list) (groups[q.status] ??= []).push(q);

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Negotiation</div>
          <h2 className="text-[24px] font-semibold leading-tight">议价工作台</h2>
        </div>
        <Link
          href="/marketplace"
          className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
        >
          去选角广场发起议价
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
          还没有议价记录 · 在选角广场或套餐页点击「我想议价」开始反向报价。
        </div>
      ) : (
        <div className="grid gap-8">
          {(["submitted", "counter", "accepted", "rejected", "expired"] as const).map((k) =>
            (groups[k]?.length ?? 0) > 0 ? (
              <div key={k}>
                <PanelTitle hint={`${groups[k]!.length} 条`}>
                  {STATUS_LABEL[k]}
                </PanelTitle>
                <div className="glass divide-y divide-line rounded-[14px]">
                  {groups[k]!.map((q) => (
                    <Link
                      key={q.id}
                      href={`/partner/quotes/${q.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] text-ink">{q.projectName}</div>
                        <div className="truncate text-[12px] text-ink-3">{q.scope}</div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-[14px] font-medium text-ink">¥{q.offerAmount.toLocaleString()}</div>
                          <div className="text-[11px] text-ink-3">分账 {q.offerShare}%</div>
                        </div>
                        <span className={"rounded-full px-2.5 py-0.5 text-[11px] " + (STATUS_TONE[q.status] ?? "")}>
                          {STATUS_LABEL[q.status] ?? q.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </DashboardShell>
  );
}
