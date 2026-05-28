import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV } from "@/lib/nav";
import { ticketStats } from "@/lib/tickets";
import { siteBaseUrl } from "@/lib/seo";

export const metadata = { title: "系统状态" };

function safeCount(stmt: string): number {
  try {
    const r = db.get<{ c: number }>(sql.raw(`SELECT COUNT(*) as c FROM ${stmt}`));
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

const TABLES_OF_INTEREST = [
  "users",
  "talents",
  "orders",
  "revenues",
  "verifications",
  "uploads",
  "contracts",
  "chain_records",
  "payments",
  "takedowns",
  "disputes",
  "invoices",
  "previews",
  "bundles",
  "quotes",
  "threads",
  "messages",
  "notifications",
  "mcn_creators",
  "distributions",
  "audit_logs",
  "nfts",
  "studio_jobs",
  "activities",
  "wallets",
  "wallet_txns",
  "withdrawals",
  "coupons",
  "referrals",
  "reviews",
  "favorites",
  "shortlists",
  "risk_flags",
  "organizations",
  "csm_assignments",
  "api_keys",
  "webhooks",
  "webhook_deliveries",
  "plans",
  "subscriptions",
  "enterprise_leads",
  "badges",
  "user_badges",
  "leaderboards",
  "export_jobs",
  "tickets",
  "ticket_messages",
  "help_votes",
];

export default async function AdminSystem() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/system");
  if (u.role !== "admin") redirect("/");

  const ts = ticketStats();
  const rows = TABLES_OF_INTEREST.map((t) => ({ table: t, count: safeCount(t) }));
  const totalRows = rows.reduce((a, b) => a + b.count, 0);
  const base = siteBaseUrl();
  const uptimeSec = Math.round(process.uptime());
  const uptimeFmt =
    uptimeSec < 60
      ? `${uptimeSec}s`
      : uptimeSec < 3600
        ? `${Math.round(uptimeSec / 60)} 分钟`
        : `${Math.round(uptimeSec / 36) / 100} 小时`;
  const mem = process.memoryUsage();

  return (
    <DashboardShell role="管理员 · 系统状态" nav={ADMIN_NAV}>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-8">
        <StatTile label="进程启动时长" value={uptimeFmt} sub={`PID ${process.pid}`} />
        <StatTile label="数据库总行数" value={totalRows.toLocaleString()} sub={`${rows.length} 张表`} />
        <StatTile label="未解决工单" value={String(ts.open + ts.pending)} sub={`avg ${ts.avgResolveHours} h`} />
        <StatTile
          label="进程内存"
          value={`${Math.round(mem.rss / 1024 / 1024)} MB`}
          sub={`heap ${Math.round(mem.heapUsed / 1024 / 1024)} MB`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <PanelTitle hint={`base = ${base}`}>表行数</PanelTitle>
          <div className="glass rounded-[14px] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-line">
              {rows.map((r) => (
                <div key={r.table} className="bg-bg p-3 flex items-center justify-between">
                  <code className="text-[12.5px] text-ink-3">{r.table}</code>
                  <span className="text-[14px] font-medium text-ink tabular-nums">
                    {r.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <PanelTitle>工单 SLA</PanelTitle>
          <div className="glass rounded-[14px] p-5 space-y-2 text-[13.5px]">
            <RowKV k="累计" v={String(ts.total)} />
            <RowKV k="处理中 open" v={String(ts.open)} />
            <RowKV k="等用户回复 pending" v={String(ts.pending)} />
            <RowKV k="已解决 resolved" v={String(ts.resolved)} />
            <RowKV k="已关闭 closed" v={String(ts.closed)} />
            <RowKV k="平均解决时长" v={`${ts.avgResolveHours} h`} />
          </div>

          <div className="mt-6">
            <PanelTitle>对外接口</PanelTitle>
            <ul className="glass rounded-[14px] p-5 space-y-2 text-[13px] text-ink-2">
              <li>
                <code className="text-ink">GET /api/health</code>
              </li>
              <li>
                <code className="text-ink">GET /sitemap.xml</code>
              </li>
              <li>
                <code className="text-ink">GET /insights/rss.xml</code>
              </li>
              <li>
                <code className="text-ink">GET /transparency</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function RowKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{k}</span>
      <span className="text-ink font-medium tabular-nums">{v}</span>
    </div>
  );
}
