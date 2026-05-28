import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc, sql } from "drizzle-orm";
import { Search, Briefcase, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";

export const metadata = { title: "制作方后台" };

const NAV = [
  { href: "/partner", label: "概览" },
  { href: "/partner/orders", label: "我的订单" },
  { href: "/partner/quotes", label: "议价工作台" },
  { href: "/marketplace", label: "选角广场 →" },
];

export default async function PartnerHome() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");

  const orders = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.partnerId, u.id))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const total = orders.reduce((a, o) => a + o.amount, 0);

  const featured = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.status, "live"))
    .orderBy(sql`${schema.talents.grade} = 'S' DESC, ${schema.talents.followers} DESC`)
    .limit(4)
    .all();

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="累计授权" value={String(orders.length)} sub="所有项目合计" />
        <StatTile label="累计支付" value={`¥${total.toLocaleString()}`} sub="授权费 + 后续分账" />
        <StatTile
          label="进行中"
          value={String(orders.filter((o) => o.status !== "settled").length)}
          sub="待审核 / 已批准"
        />
        <StatTile
          label="已结算"
          value={String(orders.filter((o) => o.status === "settled").length)}
          sub="自动分账完成"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <PanelTitle hint="最近 6 单">最新订单</PanelTitle>
          {orders.length === 0 ? (
            <div className="glass rounded-[14px] p-8 text-center">
              <Search size={20} className="mx-auto text-brand-2 mb-3" />
              <div className="text-[14px] text-ink-2 mb-4">
                还没有订单 · 去「选角广场」挑一张你心仪的脸吧。
              </div>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
              >
                <Briefcase size={14} /> 进入选角广场
              </Link>
            </div>
          ) : (
            <div className="glass rounded-[14px] divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <Link
                  key={o.id}
                  href="/partner/orders"
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] text-ink truncate">{o.projectName}</div>
                    <div className="text-[12px] text-ink-3 truncate">{o.scope}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-medium text-ink">¥{o.amount.toLocaleString()}</div>
                    <div className="text-[11px] text-ink-3">
                      {o.status === "settled"
                        ? "已结算"
                        : o.status === "approved"
                        ? "已批准"
                        : o.status === "paid"
                        ? "已支付"
                        : o.status === "delivered"
                        ? "已交付"
                        : o.status === "disputed"
                        ? "争议中"
                        : o.status === "refunded"
                        ? "已退款"
                        : o.status === "cancelled"
                        ? "已取消"
                        : "待支付"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <PanelTitle hint="基于历史与 S 级">推荐 AI 演员</PanelTitle>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((t) => (
              <Link
                key={t.id}
                href={`/marketplace/${t.id}`}
                className="glass rounded-[12px] p-3 hover:bg-white/[0.06] transition"
              >
                <div className="aspect-[4/3] rounded-md mb-3" style={{ background: t.cover }} />
                <div className="text-[13px] font-medium text-ink truncate">{t.stageName}</div>
                <div className="text-[11px] text-ink-3 mt-0.5 truncate">{t.styleTags}</div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-ink-2">
                    <ShieldCheck size={11} className="text-brand-2" /> {t.grade}
                  </span>
                  <span className="text-ink">¥{t.priceOnce.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
