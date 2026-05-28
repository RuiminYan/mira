import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Bell, CheckCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { markAllRead } from "@/app/actions/messages";

export const metadata = { title: "通知中心" };

const KIND_LABEL: Record<string, string> = {
  verification_approved: "实名通过",
  verification_rejected: "实名被驳",
  talent_approved: "形象上线",
  order_pending: "订单待支付",
  order_paid: "订单已支付",
  order_approved: "订单已批准",
  order_delivered: "订单已交付",
  order_settled: "订单已结算",
  order_refunded: "订单已退款",
  dispute_opened: "争议提交",
  dispute_resolved: "争议仲裁",
  invoice_requested: "发票申请",
  invoice_issued: "发票开具",
  takedown_requested: "下架申请",
  takedown_decision: "下架仲裁",
  new_message: "新私信",
  quote_offer: "议价新报价",
  quote_accepted: "议价成交",
  quote_rejected: "议价被拒",
  system: "系统通知",
};

function refHref(n: { kind: string; refTable: string | null; refId: number | null }): string | null {
  if (!n.refTable || !n.refId) return null;
  if (n.refTable === "orders") return `/partner/orders/${n.refId}`;
  if (n.refTable === "quotes") return `/partner/quotes/${n.refId}`;
  if (n.refTable === "invoices") return `/partner/orders`;
  if (n.refTable === "threads") return `/messages/${n.refId}`;
  if (n.refTable === "talents") return `/creator/talents`;
  if (n.refTable === "verifications") return `/creator/verify`;
  if (n.refTable === "takedowns") return `/admin/takedowns`;
  return null;
}

export default async function NotificationsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/notifications");

  const list = db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, u.id))
    .orderBy(desc(schema.notifications.createdAt))
    .all();
  const unread = list.filter((n) => !n.readAt).length;

  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Notifications</div>
          <h1 className="text-[28px] font-semibold leading-tight md:text-[34px]">
            通知中心{" "}
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-2 py-0.5 align-middle text-[12px] font-medium text-white">
                {unread} 未读
              </span>
            )}
          </h1>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-3 py-1.5 text-[13px] text-ink-2 hover:text-ink">
              <CheckCheck size={14} /> 全部已读
            </button>
          </form>
        )}
      </div>

      {list.length === 0 ? (
        <div className="glass mt-8 rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
          <Bell size={20} className="mx-auto mb-3 text-brand-2" />
          暂无通知 · 等待第一条系统消息。
        </div>
      ) : (
        <div className="glass mt-8 divide-y divide-line rounded-[14px]">
          {list.map((n) => {
            const href = refHref(n);
            const content = (
              <div className="flex items-start gap-3 px-5 py-4">
                <div
                  className={
                    "mt-1 h-2 w-2 shrink-0 rounded-full " +
                    (n.readAt ? "bg-ink-4" : "bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]")
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-ink-3">
                    <span>{KIND_LABEL[n.kind] ?? n.kind}</span>
                    <span>·</span>
                    <span>{new Date(n.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}</span>
                  </div>
                  <div className="mt-1 text-[14px] text-ink">{n.title}</div>
                  {n.body && <div className="mt-1 text-[13px] text-ink-3">{n.body}</div>}
                </div>
              </div>
            );
            return href ? (
              <Link key={n.id} href={href} className="block transition hover:bg-white/[0.04]">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
