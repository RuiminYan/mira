import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { issueInvoice } from "@/app/actions/orders";
import { ADMIN_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "发票开具" };

const STATUS_LABEL: Record<string, string> = { requested: "待开具", issued: "已开具", void: "作废" };
const STATUS_TONE: Record<string, string> = {
  requested: "bg-amber-500/15 text-amber-300",
  issued: "bg-emerald-500/15 text-emerald-300",
  void: "bg-white/[0.08] text-ink-2",
};

export default async function AdminInvoices() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=admin&next=/admin/invoices");
  if (u.role !== "admin") redirect("/");

  const rows = db
    .select({ i: schema.invoices, order: schema.orders, partner: schema.users })
    .from(schema.invoices)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.invoices.orderId))
    .leftJoin(schema.users, eq(schema.users.id, schema.invoices.partnerId))
    .orderBy(desc(schema.invoices.createdAt))
    .all();

  return (
    <DashboardShell role={`管理员 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`共 ${rows.length} 条`}>发票开具</PanelTitle>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">暂无发票申请</div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[680px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">公司</th>
                <th className="px-5 py-3 font-medium">税号</th>
                <th className="px-5 py-3 font-medium">关联订单</th>
                <th className="px-5 py-3 font-medium">类型 / 金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ i, order, partner }) => (
                <tr key={i.id} className="border-b border-line last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-ink">
                    {i.companyName}
                    <div className="text-[11px] text-ink-3 mt-0.5">{partner?.nickname ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3 text-ink-2 font-mono text-[12.5px]">{i.taxNumber}</td>
                  <td className="px-5 py-3 text-ink-2">{order?.projectName ?? "—"}</td>
                  <td className="px-5 py-3 text-ink">
                    {i.titleType === "vat_special" ? "增值税专用" : "增值税普通"} · ¥{i.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-[12px] " +
                        (STATUS_TONE[i.status] ?? "")
                      }
                    >
                      {STATUS_LABEL[i.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {i.status === "requested" ? (
                      <form action={issueInvoice} className="inline">
                        <input type="hidden" name="id" value={i.id} />
                        <button className="rounded-md px-3 py-1 text-[12px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]">
                          开具并上链
                        </button>
                      </form>
                    ) : (
                      <Link
                        href={`/invoices/${i.id}`}
                        className="rounded-md px-3 py-1 text-[12px] text-ink-2 bg-white/[0.06] hover:bg-white/[0.1]"
                      >
                        查看
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
