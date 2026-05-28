import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "收到的议价" };

const STATUS_LABEL: Record<string, string> = {
  submitted: "待回复",
  counter: "我已还价",
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

export default async function CreatorQuotesPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/quotes");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const list = db
    .select()
    .from(schema.quotes)
    .where(eq(schema.quotes.creatorId, u.id))
    .orderBy(desc(schema.quotes.updatedAt))
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${list.length} 条`}>收到的议价</PanelTitle>
      {list.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
          暂无议价请求 · 制作方提交反向报价后会出现在这里。
        </div>
      ) : (
        <div className="glass divide-y divide-line rounded-[14px]">
          {list.map((q) => (
            <Link
              key={q.id}
              href={`/creator/quotes/${q.id}`}
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
      )}
    </DashboardShell>
  );
}
