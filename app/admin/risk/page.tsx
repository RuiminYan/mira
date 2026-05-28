import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { resolveRiskFlag, unbanUser } from "@/app/actions/risk";
import { riskKindLabel, severityLabel } from "@/lib/risk";

export const metadata = { title: "风控告警" };

const SEV_TONE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-300",
  med: "bg-amber-500/15 text-amber-300",
  low: "bg-sky-500/15 text-sky-300",
};
const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-300",
  reviewing: "bg-sky-500/15 text-sky-300",
  cleared: "bg-emerald-500/15 text-emerald-300",
  banned: "bg-rose-500/15 text-rose-300",
};

export default async function AdminRiskPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/risk");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({
      f: schema.riskFlags,
      name: schema.users.nickname,
      email: schema.users.email,
      banned: schema.users.banned,
    })
    .from(schema.riskFlags)
    .leftJoin(schema.users, eq(schema.users.id, schema.riskFlags.userId))
    .orderBy(desc(schema.riskFlags.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${rows.length} 条`}>风控告警</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[840px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">时间</th>
              <th className="text-left px-3 py-2">用户</th>
              <th className="text-left px-3 py-2">类型</th>
              <th className="text-left px-3 py-2">等级</th>
              <th className="text-left px-3 py-2">详情</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-ink-3">
                  暂无风控告警
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.f.id} className="border-t border-line align-top">
                <td className="px-3 py-2 text-ink-3 whitespace-nowrap">
                  {new Date(r.f.createdAt * 1000).toLocaleString("zh-CN")}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11.5px] text-ink-4">{r.email}</div>
                  {r.banned && (
                    <form action={unbanUser} className="mt-1">
                      <input type="hidden" name="userId" value={r.f.userId} />
                      <button className="text-[11.5px] text-rose-300 hover:text-rose-200">
                        解封
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-3 py-2">{riskKindLabel(r.f.kind)}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11.5px] " + (SEV_TONE[r.f.severity] ?? "")
                    }
                  >
                    {severityLabel(r.f.severity)}
                  </span>
                </td>
                <td className="px-3 py-2 text-ink-3 max-w-[260px]">
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
                    {tryFormat(r.f.detail)}
                  </pre>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11.5px] " + (STATUS_TONE[r.f.status] ?? "")
                    }
                  >
                    {r.f.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {(r.f.status === "open" || r.f.status === "reviewing") && (
                    <div className="flex flex-wrap gap-1.5">
                      <FlagBtn id={r.f.id} decision="reviewing" label="标记审查" tone="sky" />
                      <FlagBtn id={r.f.id} decision="cleared" label="解除" tone="emerald" />
                      <FlagBtn id={r.f.id} decision="banned" label="封禁" tone="rose" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function FlagBtn({
  id,
  decision,
  label,
  tone,
}: {
  id: number;
  decision: string;
  label: string;
  tone: "sky" | "emerald" | "rose";
}) {
  const cls =
    tone === "sky"
      ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
      : tone === "emerald"
        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
        : "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25";
  return (
    <form action={resolveRiskFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button className={"rounded-md px-2.5 py-1 text-[12px] " + cls}>{label}</button>
    </form>
  );
}

function tryFormat(s: string): string {
  try {
    const v = JSON.parse(s);
    return JSON.stringify(v, null, 2);
  } catch {
    return s;
  }
}
