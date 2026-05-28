import { redirect } from "next/navigation";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { AUDIT_ACTION_LABEL } from "@/lib/audit";

export const metadata = { title: "审计日志" };

type Search = Promise<{
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}>;

const PAGE_SIZE = 50;

function tsFromDate(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s + "T00:00:00");
  if (isNaN(t)) return null;
  return Math.floor(t / 1000);
}

function fmt(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function AuditLogPage({ searchParams }: { searchParams: Search }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/audit");
  if (u.role !== "admin") redirect("/");

  const sp = await searchParams;

  const filters: SQL[] = [];
  if (sp.action) filters.push(eq(schema.auditLogs.action, sp.action));
  if (sp.actor) {
    const actorId = Number(sp.actor);
    if (Number.isFinite(actorId)) filters.push(eq(schema.auditLogs.actorId, actorId));
  }
  const fromTs = tsFromDate(sp.from);
  const toTs = tsFromDate(sp.to);
  if (fromTs) filters.push(gte(schema.auditLogs.createdAt, fromTs));
  if (toTs) filters.push(lte(schema.auditLogs.createdAt, toTs + 86400));

  const rows = db
    .select()
    .from(schema.auditLogs)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(PAGE_SIZE)
    .all();

  const actors = db.select().from(schema.users).all();
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const allActions = Object.keys(AUDIT_ACTION_LABEL);

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`最近 ${rows.length} 条`}>审计日志</PanelTitle>

      <form method="GET" className="mb-5 flex flex-wrap items-end gap-2">
        <label className="grid gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-3">操作类型</span>
          <select
            name="action"
            defaultValue={sp.action ?? ""}
            className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px] text-ink"
          >
            <option value="">全部</option>
            {allActions.map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-3">操作人 ID</span>
          <input
            name="actor"
            defaultValue={sp.actor}
            placeholder="user id"
            className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px] text-ink w-32"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-3">起始日</span>
          <input
            name="from"
            type="date"
            defaultValue={sp.from}
            className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px] text-ink"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-3">结束日</span>
          <input
            name="to"
            type="date"
            defaultValue={sp.to}
            className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px] text-ink"
          />
        </label>
        <button className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]">
          筛选
        </button>
        <a href="/admin/audit" className="px-2 py-2 text-[12px] text-ink-3 hover:text-ink">
          重置
        </a>
      </form>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          没有匹配的日志
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => {
            const a = r.actorId ? actorMap.get(r.actorId) : null;
            return (
              <details key={r.id} className="glass rounded-[12px] p-0 overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-3 flex flex-wrap items-center gap-3 hover:bg-white/[0.04]">
                  <span className="text-[11px] text-ink-3 font-mono shrink-0">#{r.id}</span>
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] bg-brand-soft text-brand shrink-0">
                    {AUDIT_ACTION_LABEL[r.action] ?? r.action}
                  </span>
                  <span className="text-[13px] text-ink truncate">
                    {a?.nickname ?? "—"} · {r.actorRole}
                  </span>
                  <span className="text-[12px] text-ink-3">
                    {r.refTable && `${r.refTable} #${r.refId}`}
                  </span>
                  <span className="text-[12px] text-ink-3 ml-auto">{fmt(r.createdAt)}</span>
                </summary>
                <div className="border-t border-line px-5 py-4 grid gap-3 text-[12px] bg-white/[0.02]">
                  {r.note && (
                    <div>
                      <div className="text-ink-3 mb-1">说明</div>
                      <div className="text-ink-2">{r.note}</div>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-ink-3 mb-1">变更前</div>
                      <pre className="text-[11.5px] font-mono text-ink-2 bg-bg/40 rounded-md p-3 overflow-auto max-h-60 leading-5">
                        {r.before ? formatJson(r.before) : "—"}
                      </pre>
                    </div>
                    <div>
                      <div className="text-ink-3 mb-1">变更后</div>
                      <pre className="text-[11.5px] font-mono text-ink-2 bg-bg/40 rounded-md p-3 overflow-auto max-h-60 leading-5">
                        {r.after ? formatJson(r.after) : "—"}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function formatJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
