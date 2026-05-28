import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { resolveDispute } from "@/app/actions/orders";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "争议仲裁" };

const KIND: Record<string, string> = {
  quality: "质量问题",
  non_delivery: "未交付",
  misuse: "超范围使用",
};
const STATUS_LABEL: Record<string, string> = {
  submitted: "待仲裁",
  in_review: "仲裁中",
  upheld_creator: "支持创作者",
  upheld_partner: "支持制作方",
  closed: "已关闭",
};
const STATUS_TONE: Record<string, string> = {
  submitted: "bg-red-500/15 text-red-300",
  in_review: "bg-amber-500/15 text-amber-300",
  upheld_creator: "bg-emerald-500/15 text-emerald-300",
  upheld_partner: "bg-sky-500/15 text-sky-300",
  closed: "bg-white/[0.08] text-ink-2",
};

export default async function AdminDisputes() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/disputes");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({
      d: schema.disputes,
      order: schema.orders,
      partner: schema.users,
    })
    .from(schema.disputes)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.disputes.orderId))
    .leftJoin(schema.users, eq(schema.users.id, schema.disputes.partnerId))
    .orderBy(desc(schema.disputes.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`共 ${rows.length} 条`}>争议与仲裁</PanelTitle>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">暂无争议</div>
      ) : (
        <div className="grid gap-3">
          {rows.map(({ d, order, partner }) => (
            <div key={d.id} className="glass rounded-[14px] p-5">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium text-ink">
                    {order?.projectName ?? "—"} <span className="text-ink-3 text-[12px]">#{d.orderId}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-3 mt-1">
                    制作方: {partner?.nickname ?? "—"} · {KIND[d.kind]} ·{" "}
                    {new Date(d.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}
                  </div>
                  <div className="text-[13px] text-ink-2 leading-6 mt-2">{d.description}</div>
                  {d.decisionNote && (
                    <div className="text-[12.5px] text-ink-3 mt-2">
                      结论: {d.decisionNote}
                      {d.refundAmount !== null && d.refundAmount !== undefined && d.refundAmount > 0 && (
                        <> · 退款 ¥{d.refundAmount.toLocaleString()}</>
                      )}
                    </div>
                  )}
                </div>
                <span
                  className={
                    "inline-flex rounded-full px-2 py-0.5 text-[12px] " + (STATUS_TONE[d.status] ?? "")
                  }
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </div>

              {(d.status === "submitted" || d.status === "in_review") && (
                <form action={resolveDispute} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] items-start">
                  <input type="hidden" name="id" value={d.id} />
                  <div className="grid gap-2">
                    <input
                      name="note"
                      placeholder="仲裁结论"
                      required
                      className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13px] text-ink placeholder:text-ink-4"
                    />
                    <input
                      name="refundAmount"
                      type="number"
                      min={0}
                      defaultValue={order?.amount ?? 0}
                      placeholder="退款金额(支持制作方时填写)"
                      className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13px] text-ink placeholder:text-ink-4"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      name="decision"
                      value="upheld_creator"
                      className="rounded-md px-3 py-2 text-[12px] font-medium text-white bg-emerald-500/80 hover:bg-emerald-500"
                    >
                      支持创作者
                    </button>
                    <button
                      name="decision"
                      value="upheld_partner"
                      className="rounded-md px-3 py-2 text-[12px] font-medium text-white bg-sky-500/80 hover:bg-sky-500"
                    >
                      支持制作方(退款)
                    </button>
                    <button
                      name="decision"
                      value="closed"
                      className="rounded-md px-3 py-2 text-[12px] font-medium text-ink bg-white/[0.08] hover:bg-white/[0.12]"
                    >
                      关闭
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
