import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle, StatTile } from "@/components/DashboardLayout";
import { ADMIN_NAV } from "@/lib/nav";
import { countDeliveryStatuses, recentDeliveries } from "@/lib/webhookQueue";
import { triggerWebhookTick } from "./actions";

export const metadata = { title: "Webhook 重试队列" };

type Search = Promise<{ ok?: string }>;

const STATUS_TONE: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-300",
  fail: "bg-rose-500/15 text-rose-300",
};

function relTime(epochSec: number): string {
  const diff = epochSec - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "已到期";
  if (diff < 60) return `${diff} 秒后`;
  if (diff < 3600) return `${Math.round(diff / 60)} 分钟后`;
  if (diff < 86400) return `${Math.round(diff / 3600)} 小时后`;
  return `${Math.round(diff / 86400)} 天后`;
}

export default async function WebhookQueuePage({ searchParams }: { searchParams: Search }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?role=admin&next=/admin/webhooks/queue");
  if (me.role !== "admin") redirect("/");

  const sp = await searchParams;
  const stats = countDeliveryStatuses();
  const rows = recentDeliveries(30);

  return (
    <DashboardShell role="管理员 · Webhook 队列" nav={ADMIN_NAV}>
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <StatTile label="待重试" value={String(stats.pending)} sub="pending" />
        <StatTile label="成功" value={String(stats.ok)} sub="ok" />
        <StatTile label="失败" value={String(stats.fail)} sub="fail · 已达 5 次重试" />
      </div>

      {sp.ok === "tick" && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[12.5px] text-emerald-200">
          已手动触发一次队列处理。
        </div>
      )}

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <form action={triggerWebhookTick}>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13.5px] font-medium text-white hover:brightness-110"
          >
            手动触发一次重试
          </button>
        </form>
        <div className="text-[12px] text-ink-3">
          指数退避:60s / 5min / 15min / 1h / 4h;达 5 次失败后,webhook 暂停。
        </div>
      </div>

      <PanelTitle hint={`${rows.length} 条`}>最近投递</PanelTitle>
      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3 text-[13px]">
          暂无投递记录。
        </div>
      ) : (
        <div className="glass rounded-[14px] overflow-hidden divide-y divide-line">
          {rows.map((row) => {
            const d = row.d;
            return (
              <div key={d.id} className="p-4 flex flex-wrap items-center gap-3">
                <span
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] " +
                    (STATUS_TONE[d.status] || "")
                  }
                >
                  {d.status}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] text-ink font-medium truncate">
                    #{d.id} · {d.event}
                  </div>
                  <div className="text-[11.5px] text-ink-4 mt-0.5 truncate">
                    {row.hookUrl ?? "(hook missing)"} · 尝试 {d.attemptCount}/5
                    {d.httpCode != null ? ` · HTTP ${d.httpCode}` : ""}
                  </div>
                  {d.responseSnippet && (
                    <div className="text-[11.5px] text-ink-4 mt-0.5 truncate font-mono">
                      {d.responseSnippet}
                    </div>
                  )}
                </div>
                <div className="text-right text-[11.5px] text-ink-3 shrink-0">
                  <div>{new Date(d.createdAt * 1000).toLocaleString("zh-CN")}</div>
                  {d.status === "pending" && d.nextRetryAt != null && (
                    <div className="text-amber-300 mt-0.5">下一次 · {relTime(d.nextRetryAt)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
