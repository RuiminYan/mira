import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { PARTNER_NAV as NAV } from "@/lib/nav";
import { inviteOrgMember } from "@/app/actions/orgs";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "团队工作台" };

const loadSearch = createLoader({
  ok: parseAsString,
  err: parseAsString,
});

export default async function OrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const p = await params;
  const sp = await loadSearch(searchParams);
  const orgId = Number(p.id);
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).get();
  if (!org) notFound();

  const myMember = db
    .select()
    .from(schema.orgMembers)
    .where(and(eq(schema.orgMembers.orgId, orgId), eq(schema.orgMembers.userId, u.id)))
    .get();
  if (!myMember && u.role !== "admin") redirect("/partner");

  const members = db
    .select({ m: schema.orgMembers, name: schema.users.nickname, email: schema.users.email })
    .from(schema.orgMembers)
    .leftJoin(schema.users, eq(schema.users.id, schema.orgMembers.userId))
    .where(eq(schema.orgMembers.orgId, orgId))
    .all();

  const memberIds = members.map((m) => m.m.userId);
  const orders =
    memberIds.length > 0
      ? db
          .select({
            o: schema.orders,
            partnerName: schema.users.nickname,
            talentName: schema.talents.stageName,
          })
          .from(schema.orders)
          .leftJoin(schema.users, eq(schema.users.id, schema.orders.partnerId))
          .leftJoin(schema.talents, eq(schema.talents.id, schema.orders.talentId))
          .where(inArray(schema.orders.partnerId, memberIds))
          .orderBy(desc(schema.orders.createdAt))
          .limit(20)
          .all()
      : [];

  const csm = db
    .select({ a: schema.csmAssignments, csmName: schema.users.nickname })
    .from(schema.csmAssignments)
    .leftJoin(schema.users, eq(schema.users.id, schema.csmAssignments.csmId))
    .where(eq(schema.csmAssignments.orgId, orgId))
    .get();

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <Link href="/partner" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回
      </Link>
      <h1 className="mt-2 text-[24px] font-semibold">{org.name}</h1>
      {org.description && <p className="text-[13.5px] text-ink-3 mt-1">{org.description}</p>}

      {csm && (
        <div className="mt-4 rounded-md border border-line-2 bg-gradient-to-r from-[#6E59F6]/8 to-[#FF6FB4]/8 px-4 py-3 text-[13px]">
          <span className="text-ink-3">你的客户成功经理:</span>{" "}
          <span className="font-medium">{csm.csmName}</span>
          {csm.a.note && <span className="text-ink-4 ml-2">· {csm.a.note}</span>}
        </div>
      )}

      <PanelTitle hint={`${members.length} 人`}>团队成员</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto mb-6">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">昵称</th>
              <th className="text-left px-3 py-2">邮箱</th>
              <th className="text-left px-3 py-2">角色</th>
              <th className="text-left px-3 py-2">加入时间</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.m.id} className="border-t border-line">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2 text-ink-3">{m.email}</td>
                <td className="px-3 py-2">{m.m.role === "owner" ? "所有者" : "成员"}</td>
                <td className="px-3 py-2 text-ink-3">
                  {new Date(m.m.joinedAt * 1000).toLocaleDateString("zh-CN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(myMember?.role === "owner" || u.role === "admin") && (
        <>
          <PanelTitle>邀请成员</PanelTitle>
          {sp.ok === "invite" && (
            <div className="mb-3 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[12.5px] text-emerald-300">
              邀请已发送
            </div>
          )}
          {sp.ok === "already" && (
            <div className="mb-3 rounded-md bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-[12.5px] text-amber-300">
              该邮箱已在团队中
            </div>
          )}
          <form
            action={inviteOrgMember}
            className="grid gap-3 md:grid-cols-[2fr_auto] mb-8 rounded-md border border-line bg-surface/40 p-4"
          >
            <input type="hidden" name="orgId" value={org.id} />
            <input
              name="email"
              type="email"
              required
              placeholder="邀请邮箱"
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px]"
            />
            <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13px]">
              发送邀请
            </button>
          </form>
        </>
      )}

      <PanelTitle hint={`${orders.length} 单`}>团队订单(最近 20)</PanelTitle>
      <div className="rounded-md border border-line overflow-x-auto">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead className="bg-white/[0.04] text-ink-3">
            <tr>
              <th className="text-left px-3 py-2">项目</th>
              <th className="text-left px-3 py-2">形象</th>
              <th className="text-left px-3 py-2">下单人</th>
              <th className="text-right px-3 py-2">金额</th>
              <th className="text-left px-3 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-3">
                  暂无团队订单
                </td>
              </tr>
            )}
            {orders.map((row) => (
              <tr key={row.o.id} className="border-t border-line">
                <td className="px-3 py-2">{row.o.projectName}</td>
                <td className="px-3 py-2 text-ink-3">{row.talentName}</td>
                <td className="px-3 py-2 text-ink-3">{row.partnerName}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ¥{row.o.amount.toLocaleString()}
                </td>
                <td className="px-3 py-2">{row.o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
