import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV } from "@/lib/nav";
import { archivePlan } from "@/app/actions/plans";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "套餐管理" };

const NAV = [...ADMIN_NAV, { href: "/admin/plans", label: "套餐管理" }, { href: "/admin/enterprise-leads", label: "企业咨询" }];

const loadSearch = createLoader({
  ok: parseAsString,
});

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/plans");
  if (u.role !== "admin") redirect("/");
  const sp = await loadSearch(searchParams);

  const plans = db.select().from(schema.plans).orderBy(desc(schema.plans.sortOrder)).all();
  const subs = db
    .select({ planId: schema.subscriptions.planId, c: sql<number>`count(*)` })
    .from(schema.subscriptions)
    .groupBy(schema.subscriptions.planId)
    .all();
  const subCount = new Map(subs.map((s) => [s.planId, s.c]));

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${plans.length} 个套餐`}>套餐管理</PanelTitle>
      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已更新。
        </div>
      )}
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">Code</th>
              <th className="text-left px-3 py-2">名称</th>
              <th className="text-left px-3 py-2">月价</th>
              <th className="text-left px-3 py-2">订阅数</th>
              <th className="text-left px-3 py-2">配额(订单 / API / 席位)</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-[12px]">{p.code}</td>
                <td className="px-3 py-2 text-ink">{p.name}</td>
                <td className="px-3 py-2">
                  {p.priceMonth === 0 ? "免费" : `¥${(p.priceMonth / 100).toFixed(0)}`}
                </td>
                <td className="px-3 py-2 tabular-nums">{subCount.get(p.id) ?? 0}</td>
                <td className="px-3 py-2 text-ink-3">
                  {p.quotaOrders || "∞"} · {(p.quotaApiCalls || 0).toLocaleString()} · {p.quotaSeats}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] " +
                      (p.status === "live"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-zinc-500/15 text-zinc-300")
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <form action={archivePlan}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-[12.5px] text-ink-3 hover:text-ink">
                      {p.status === "live" ? "归档" : "重新上架"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
