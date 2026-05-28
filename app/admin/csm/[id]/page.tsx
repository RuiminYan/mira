import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { ADMIN_NAV as NAV } from "@/lib/nav";
import { recordCsmTouch, updateCsmAssignment } from "@/app/actions/csm";

export const metadata = { title: "客户 360 视图" };

const TIER_OPTIONS: { value: "vip" | "standard" | "inactive"; label: string }[] = [
  { value: "vip", label: "VIP" },
  { value: "standard", label: "标准" },
  { value: "inactive", label: "休眠" },
];

export default async function CsmDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/csm");
  if (u.role !== "admin") redirect("/");
  const p = await params;
  const sp = await searchParams;

  const a = db.select().from(schema.csmAssignments).where(eq(schema.csmAssignments.id, Number(p.id))).get();
  if (!a) notFound();

  let subjectName = "";
  let memberIds: number[] = [];
  if (a.subjectKind === "org" && a.orgId) {
    const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, a.orgId)).get();
    subjectName = org?.name ?? `团队 #${a.orgId}`;
    memberIds = db
      .select({ id: schema.orgMembers.userId })
      .from(schema.orgMembers)
      .where(eq(schema.orgMembers.orgId, a.orgId))
      .all()
      .map((x) => x.id);
  } else if (a.subjectKind === "user" && a.userId) {
    const subj = db.select().from(schema.users).where(eq(schema.users.id, a.userId)).get();
    subjectName = subj?.nickname ?? `用户 #${a.userId}`;
    memberIds = [a.userId];
  }

  const orderStat =
    memberIds.length > 0
      ? db
          .select({
            c: sql<number>`count(*)`,
            sum: sql<number>`coalesce(sum(${schema.orders.amount}),0)`,
          })
          .from(schema.orders)
          .where(sql`${schema.orders.partnerId} IN (${sql.join(memberIds, sql`, `)})`)
          .get()
      : { c: 0, sum: 0 };

  const recentOrders =
    memberIds.length > 0
      ? db
          .select()
          .from(schema.orders)
          .where(sql`${schema.orders.partnerId} IN (${sql.join(memberIds, sql`, `)})`)
          .orderBy(desc(schema.orders.createdAt))
          .limit(5)
          .all()
      : [];

  const openRisk =
    memberIds.length > 0
      ? db
          .select()
          .from(schema.riskFlags)
          .where(sql`${schema.riskFlags.userId} IN (${sql.join(memberIds, sql`, `)})`)
          .all()
          .filter((r) => r.status === "open" || r.status === "reviewing").length
      : 0;

  const unreadNotif =
    memberIds.length > 0
      ? db
          .select({ c: sql<number>`count(*)` })
          .from(schema.notifications)
          .where(
            and(
              sql`${schema.notifications.userId} IN (${sql.join(memberIds, sql`, `)})`,
              isNull(schema.notifications.readAt)
            )
          )
          .get()
      : { c: 0 };

  const touches = db
    .select()
    .from(schema.csmTouches)
    .where(eq(schema.csmTouches.assignmentId, a.id))
    .orderBy(desc(schema.csmTouches.createdAt))
    .all();

  const tags = safeArray(a.tags);

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <Link href="/admin/csm" className="text-[12.5px] text-ink-3 hover:text-ink">← 返回 CSM 列表</Link>
      <PanelTitle hint={`#${a.id}`}>{subjectName} · 客户 360 视图</PanelTitle>
      {sp.ok && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已保存。
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="累计订单" value={`${orderStat?.c ?? 0}`} />
        <Stat label="累计金额" value={`¥${(orderStat?.sum ?? 0).toLocaleString()}`} />
        <Stat label="未读通知" value={`${unreadNotif?.c ?? 0}`} />
        <Stat label="风险告警" value={`${openRisk}`} tone={openRisk > 0 ? "warn" : "ok"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[12px] border border-line bg-surface/40 p-5">
          <div className="text-[14px] font-medium mb-3">画像 / 标签</div>
          <form action={updateCsmAssignment} className="grid gap-3">
            <input type="hidden" name="id" value={a.id} />
            <label className="grid gap-1">
              <span className="text-[12px] text-ink-3">Tier</span>
              <select name="tier" defaultValue={a.tier} className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]">
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-[12px] text-ink-3">下次回访 (YYYY-MM-DD)</span>
              <input
                name="nextCheckinAt"
                type="date"
                defaultValue={a.nextCheckinAt ? new Date(a.nextCheckinAt * 1000).toISOString().slice(0, 10) : ""}
                className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[12px] text-ink-3">标签 (逗号分隔)</span>
              <input
                name="tags"
                defaultValue={tags.join(", ")}
                placeholder="续约风险, 大额客户, 合规重点"
                className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]"
              />
            </label>
            <div>
              <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-3 py-1.5 text-[12.5px]">保存画像</button>
            </div>
          </form>
        </div>

        <div className="rounded-[12px] border border-line bg-surface/40 p-5">
          <div className="text-[14px] font-medium mb-3">记录回访</div>
          <form action={recordCsmTouch} className="grid gap-3">
            <input type="hidden" name="assignmentId" value={a.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[12px] text-ink-3">方式</span>
                <select name="kind" className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]">
                  <option value="call">电话</option>
                  <option value="email">邮件</option>
                  <option value="meeting">会议</option>
                  <option value="note">内部备注</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] text-ink-3">下一步</span>
                <input name="nextAction" placeholder="如:下周三跟进续约" className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]" />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-[12px] text-ink-3">回访摘要 *</span>
              <textarea name="summary" required rows={3} className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]" />
            </label>
            <div>
              <button className="rounded-md bg-white/[0.06] px-3 py-1.5 text-[12.5px]">记录</button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="text-[13px] font-medium text-ink-2 mb-3">最近订单</div>
          {recentOrders.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-ink-3 text-[13px]">无</div>
          ) : (
            <div className="rounded-md border border-line overflow-x-auto">
              <table className="w-full min-w-[420px] text-[12.5px]">
                <thead className="bg-white/[0.04] text-ink-3">
                  <tr>
                    <th className="text-left px-3 py-2">时间</th>
                    <th className="text-left px-3 py-2">项目</th>
                    <th className="text-left px-3 py-2">金额</th>
                    <th className="text-left px-3 py-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-line">
                      <td className="px-3 py-2 text-ink-3">{new Date(o.createdAt * 1000).toLocaleDateString("zh-CN")}</td>
                      <td className="px-3 py-2 truncate max-w-[180px]">{o.projectName}</td>
                      <td className="px-3 py-2 tabular-nums">¥{o.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-ink-3">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="text-[13px] font-medium text-ink-2 mb-3">回访时间线 ({touches.length})</div>
          {touches.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-4 py-8 text-center text-ink-3 text-[13px]">还没有回访记录</div>
          ) : (
            <ol className="relative border-l border-line ml-3 space-y-3">
              {touches.map((t) => (
                <li key={t.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-2 h-2.5 w-2.5 rounded-full bg-brand-2" />
                  <div className="rounded-[10px] border border-line bg-surface/40 p-3">
                    <div className="flex items-center justify-between gap-2 text-[11.5px] text-ink-4">
                      <span>{new Date(t.createdAt * 1000).toLocaleString("zh-CN")}</span>
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{t.kind}</span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink-2 leading-6 whitespace-pre-wrap">{t.summary}</p>
                    {t.nextAction && (
                      <div className="mt-2 text-[11.5px] text-amber-200">下一步:{t.nextAction}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={"rounded-[12px] border p-4 " + (tone === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-line bg-surface/40")}>
      <div className="text-[11px] uppercase tracking-widest text-ink-3">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tabular-nums">{value}</div>
    </div>
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
