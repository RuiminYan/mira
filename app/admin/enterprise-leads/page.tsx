import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV } from "@/lib/nav";
import { updateLeadStatus } from "@/app/actions/plans";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "企业咨询" };

const loadSearch = createLoader({
  ok: parseAsString,
});

const NAV = [...ADMIN_NAV, { href: "/admin/plans", label: "套餐管理" }, { href: "/admin/enterprise-leads", label: "企业咨询" }];

const STATUS_LABEL: Record<string, string> = {
  new: "新建",
  contacted: "已联系",
  won: "已签约",
  lost: "已流失",
};
const STATUS_TONE: Record<string, string> = {
  new: "bg-amber-500/15 text-amber-300",
  contacted: "bg-cyan-500/15 text-cyan-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-zinc-500/15 text-zinc-300",
};

export default async function AdminEnterpriseLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/enterprise-leads");
  if (u.role !== "admin") redirect("/");
  const sp = await loadSearch(searchParams);

  const leads = db
    .select()
    .from(schema.enterpriseLeads)
    .orderBy(desc(schema.enterpriseLeads.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${leads.length} 条线索`}>企业咨询 CRM</PanelTitle>
      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          状态已更新。
        </div>
      )}

      {leads.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
          还没有企业咨询线索
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((l) => (
            <div key={l.id} className="rounded-[12px] border border-line bg-surface/40 p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[16px] font-semibold text-ink">{l.company}</div>
                    <span className={"rounded-full px-2 py-0.5 text-[11px] " + (STATUS_TONE[l.status] ?? "")}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink-3">
                    {l.contactName} · {l.email} {l.phone && " · " + l.phone}
                  </div>
                  <div className="mt-1 text-[12px] text-ink-4">
                    {l.industry || "—"} · 团队规模 {l.employees || "—"} · {new Date(l.createdAt * 1000).toLocaleString("zh-CN")}
                  </div>
                  {l.requirement && (
                    <p className="mt-3 text-[13px] text-ink-2 leading-6 max-w-prose">{l.requirement}</p>
                  )}
                </div>
                <form action={updateLeadStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select
                    name="status"
                    defaultValue={l.status}
                    aria-label="状态"
                    className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[12.5px]"
                  >
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button className="rounded-md bg-white/[0.06] px-3 py-1.5 text-[12.5px]">更新</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
