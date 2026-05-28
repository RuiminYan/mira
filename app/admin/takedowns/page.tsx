import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { reviewTakedown } from "@/app/actions/talents";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "下架申请审核" };

const STATUS_LABEL: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已驳回" };
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-red-500/15 text-red-300",
  rejected: "bg-white/[0.08] text-ink-2",
};

export default async function AdminTakedowns() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/takedowns");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({ td: schema.takedowns, talent: schema.talents, user: schema.users })
    .from(schema.takedowns)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.takedowns.talentId))
    .leftJoin(schema.users, eq(schema.users.id, schema.takedowns.userId))
    .orderBy(desc(schema.takedowns.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`共 ${rows.length} 条`}>下架申请(被遗忘权)</PanelTitle>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">暂无申请</div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ td, talent, user }) => (
            <div key={td.id} className="glass rounded-[14px] p-5">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium text-ink">
                    {talent?.stageName ?? "—"}
                  </div>
                  <div className="text-[12.5px] text-ink-3 mt-1">
                    申请人: {user?.nickname ?? "—"} ·{" "}
                    {new Date(td.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}
                  </div>
                  <div className="text-[13px] text-ink-2 leading-6 mt-2">理由: {td.reason}</div>
                </div>
                <span
                  className={
                    "inline-flex rounded-full px-2 py-0.5 text-[12px] " + (STATUS_TONE[td.status] ?? "")
                  }
                >
                  {STATUS_LABEL[td.status]}
                </span>
              </div>

              {td.status === "pending" && (
                <form action={reviewTakedown} className="mt-4 flex gap-2">
                  <input type="hidden" name="id" value={td.id} />
                  <button
                    name="action"
                    value="approve"
                    className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500"
                  >
                    批准下架并上链
                  </button>
                  <button
                    name="action"
                    value="reject"
                    className="rounded-md px-4 py-2 text-[13px] font-medium text-ink bg-white/[0.08] hover:bg-white/[0.12]"
                  >
                    驳回
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
