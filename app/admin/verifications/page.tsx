import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { reviewVerification } from "@/app/actions/verifications";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "实名审核" };

const STATUS_LABEL: Record<string, string> = {
  submitted: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};
const STATUS_TONE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
};

export default async function AdminVerifications() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/verifications");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({ v: schema.verifications, user: schema.users })
    .from(schema.verifications)
    .leftJoin(schema.users, eq(schema.users.id, schema.verifications.userId))
    .orderBy(desc(schema.verifications.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`共 ${rows.length} 条`}>实名认证审核</PanelTitle>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">还没有创作者提交认证</div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ v, user }) => (
            <div key={v.id} className="glass rounded-[14px] p-5">
              <div className="flex flex-wrap items-start gap-4 justify-between">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium text-ink">
                    {v.realName} <span className="text-ink-3 text-[12px]">@ {user?.nickname ?? "—"}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-3 mt-1 leading-5">
                    证件后 4 位 {v.idCardLast4} · 哈希 <span className="font-mono">{v.idCardHashSHA256.slice(0, 16)}…</span> · 手机 {v.phone.slice(0, 3)}****{v.phone.slice(-4)}
                  </div>
                  {v.reason && (
                    <div className="text-[12.5px] text-amber-300 mt-2">驳回理由: {v.reason}</div>
                  )}
                </div>
                <span
                  className={
                    "inline-flex rounded-full px-2 py-0.5 text-[12px] " +
                    (STATUS_TONE[v.status] ?? "")
                  }
                >
                  {STATUS_LABEL[v.status]}
                </span>
              </div>

              {v.status === "submitted" && (
                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <form action={reviewVerification} className="contents">
                    <input type="hidden" name="id" value={v.id} />
                    <input
                      name="reason"
                      placeholder="驳回理由(批准时无需填写)"
                      className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13px] text-ink placeholder:text-ink-4"
                    />
                    <button
                      name="action"
                      value="approve"
                      className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-emerald-500/80 hover:bg-emerald-500"
                    >
                      批准并上链
                    </button>
                    <button
                      name="action"
                      value="reject"
                      className="rounded-md px-4 py-2 text-[13px] font-medium text-ink bg-white/[0.08] hover:bg-white/[0.12]"
                    >
                      驳回
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
