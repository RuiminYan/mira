import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listTicketsForUser, categoryLabel, statusLabel } from "@/lib/tickets";

export const metadata = { title: "我的工单" };

const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-300",
  pending: "bg-sky-500/15 text-sky-300",
  resolved: "bg-emerald-500/15 text-emerald-300",
  closed: "bg-white/[0.08] text-ink-3",
};

export default async function MyTicketsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/help/tickets");
  const rows = listTicketsForUser(me.id);

  return (
    <section className="container-page max-w-4xl py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1.5">客服支持</div>
          <h1 className="text-[28px] md:text-[34px] font-semibold leading-tight">我的工单</h1>
        </div>
        <Link
          href="/help/contact"
          className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13.5px] font-medium text-white"
        >
          提交新工单 →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          目前没有任何工单。遇到问题?
          <Link className="ml-2 text-brand hover:underline" href="/help/contact">
            提交一个
          </Link>
          。
        </div>
      ) : (
        <div className="glass rounded-[14px] overflow-hidden divide-y divide-line">
          {rows.map((t) => (
            <Link
              key={t.id}
              href={`/help/tickets/${t.id}`}
              className="block p-5 hover:bg-white/[0.04] transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] text-ink-3 mb-1">
                    #{t.id} · {categoryLabel(t.category)} ·{" "}
                    {new Date(t.createdAt * 1000).toLocaleDateString("zh-CN")}
                  </div>
                  <div className="text-[15px] text-ink font-medium leading-snug">
                    {t.subject}
                  </div>
                  {t.body && (
                    <p className="mt-1.5 text-[13px] text-ink-3 line-clamp-1">{t.body}</p>
                  )}
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] " +
                    (STATUS_TONE[t.status] || "")
                  }
                >
                  {statusLabel(t.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
