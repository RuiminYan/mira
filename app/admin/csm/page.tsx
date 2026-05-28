import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { assignCsm } from "@/app/actions/orgs";

export const metadata = { title: "客户成功" };

const TIER_LABEL: Record<string, string> = {
  vip: "VIP",
  standard: "标准",
  inactive: "休眠",
};
const TIER_TONE: Record<string, string> = {
  vip: "bg-amber-500/15 text-amber-300",
  standard: "bg-cyan-500/15 text-cyan-300",
  inactive: "bg-zinc-500/15 text-zinc-300",
};

export default async function AdminCsmPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; tier?: string; sort?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/csm");
  if (u.role !== "admin") redirect("/");
  const sp = await searchParams;
  const tierFilter = sp.tier && ["vip", "standard", "inactive"].includes(sp.tier) ? sp.tier : null;
  const sort = sp.sort === "checkin" ? "checkin" : "recent";

  const orgs = db.select().from(schema.organizations).all();
  const partners = db.select().from(schema.users).where(eq(schema.users.role, "partner")).all();
  const csms = db.select().from(schema.users).where(eq(schema.users.role, "admin")).all();

  let q = db
    .select({
      a: schema.csmAssignments,
      csmName: schema.users.nickname,
    })
    .from(schema.csmAssignments)
    .leftJoin(schema.users, eq(schema.users.id, schema.csmAssignments.csmId))
    .$dynamic();
  if (tierFilter) q = q.where(eq(schema.csmAssignments.tier, tierFilter as "vip" | "standard" | "inactive"));
  if (sort === "checkin") {
    q = q.orderBy(asc(sql`coalesce(${schema.csmAssignments.nextCheckinAt}, 99999999999)`));
  } else {
    q = q.orderBy(desc(schema.csmAssignments.startedAt));
  }
  const assignments = q.all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle>分配客户成功经理</PanelTitle>

      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          分配成功
        </div>
      )}

      <form
        action={assignCsm}
        className="grid gap-3 md:grid-cols-5 mb-8 rounded-md border border-line bg-surface/40 p-4"
      >
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">对象类型</span>
          <select name="subjectKind" className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]">
            <option value="org">团队</option>
            <option value="user">个人(partner)</option>
          </select>
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-[11.5px] text-ink-3">对象</span>
          <select name="subjectId" className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]" required>
            <optgroup label="团队">
              {orgs.map((o) => (
                <option key={"org-" + o.id} value={o.id}>{o.name} (#{o.id})</option>
              ))}
            </optgroup>
            <optgroup label="制作方">
              {partners.map((p) => (
                <option key={"u-" + p.id} value={p.id}>{p.nickname} (#{p.id})</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">CSM</span>
          <select name="csmId" className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]" required>
            {csms.map((c) => (
              <option key={c.id} value={c.id}>{c.nickname}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11.5px] text-ink-3">备注</span>
          <input name="note" placeholder="微信 / 服务时段" className="rounded-md bg-bg/40 border border-line px-2.5 py-2 text-[13px]" />
        </label>
        <div className="md:col-span-5">
          <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13px]">分配</button>
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-[12.5px]">
        <span className="text-ink-3">筛选 tier:</span>
        <Link href={`/admin/csm?sort=${sort}`} className={"rounded-md px-2.5 py-1 " + (!tierFilter ? "bg-white/[0.1] text-ink" : "text-ink-3 hover:text-ink")}>
          全部
        </Link>
        {(["vip", "standard", "inactive"] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/csm?tier=${t}&sort=${sort}`}
            className={"rounded-md px-2.5 py-1 " + (tierFilter === t ? "bg-white/[0.1] text-ink" : "text-ink-3 hover:text-ink")}
          >
            {TIER_LABEL[t]}
          </Link>
        ))}
        <span className="ml-auto text-ink-3">排序:</span>
        <Link
          href={`/admin/csm${tierFilter ? `?tier=${tierFilter}&sort=recent` : "?sort=recent"}`}
          className={"rounded-md px-2.5 py-1 " + (sort === "recent" ? "bg-white/[0.1] text-ink" : "text-ink-3 hover:text-ink")}
        >
          最近分配
        </Link>
        <Link
          href={`/admin/csm${tierFilter ? `?tier=${tierFilter}&sort=checkin` : "?sort=checkin"}`}
          className={"rounded-md px-2.5 py-1 " + (sort === "checkin" ? "bg-white/[0.1] text-ink" : "text-ink-3 hover:text-ink")}
        >
          下次回访
        </Link>
      </div>

      <PanelTitle hint={`${assignments.length} 条`}>分配历史</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">时间</th>
              <th className="text-left px-3 py-2">对象</th>
              <th className="text-left px-3 py-2">CSM</th>
              <th className="text-left px-3 py-2">Tier</th>
              <th className="text-left px-3 py-2">下次回访</th>
              <th className="text-left px-3 py-2">标签</th>
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-ink-3">暂无分配</td></tr>
            )}
            {assignments.map((row) => {
              const tags = safeArray(row.a.tags);
              return (
                <tr key={row.a.id} className="border-t border-line">
                  <td className="px-3 py-2 text-ink-3">
                    {new Date(row.a.startedAt * 1000).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-3 py-2">
                    {row.a.subjectKind === "org" ? `团队 #${row.a.orgId}` : `用户 #${row.a.userId}`}
                  </td>
                  <td className="px-3 py-2">{row.csmName}</td>
                  <td className="px-3 py-2">
                    <span className={"rounded-full px-2 py-0.5 text-[11px] " + (TIER_TONE[row.a.tier] ?? "")}>
                      {TIER_LABEL[row.a.tier] ?? row.a.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink-3">
                    {row.a.nextCheckinAt ? new Date(row.a.nextCheckinAt * 1000).toLocaleDateString("zh-CN") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <span key={t} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-ink-3">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/csm/${row.a.id}`} className="text-brand-2 text-[12.5px] hover:underline">
                      详情 →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function safeArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
