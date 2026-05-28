import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { MessageSquare } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "消息中心" };

const KIND_LABEL: Record<string, string> = {
  dm: "私信",
  order: "订单",
  quote: "议价",
  system: "系统",
};

export default async function MessagesPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/messages");

  const myParts = db
    .select()
    .from(schema.threadParticipants)
    .where(eq(schema.threadParticipants.userId, u.id))
    .all();
  const threadIds = myParts.map((p) => p.threadId);
  const threads = threadIds.length
    ? db
        .select()
        .from(schema.threads)
        .where(inArray(schema.threads.id, threadIds))
        .orderBy(desc(schema.threads.lastMessageAt))
        .all()
    : [];

  return (
    <section className="container-page py-12 md:py-16">
      <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Inbox</div>
      <h1 className="text-[28px] font-semibold leading-tight md:text-[34px]">消息中心</h1>

      {threads.length === 0 ? (
        <div className="glass mt-8 rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
          <MessageSquare size={20} className="mx-auto mb-3 text-brand-2" />
          暂无对话 · 订单与议价的系统私信会出现在这里。
        </div>
      ) : (
        <div className="glass mt-8 divide-y divide-line rounded-[14px]">
          {threads.map((t) => {
            const me = myParts.find((p) => p.threadId === t.id);
            return (
              <Link
                key={t.id}
                href={`/messages/${t.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-ink-3">
                    <span>{KIND_LABEL[t.kind] ?? t.kind}</span>
                    <span>·</span>
                    <span>{new Date(t.lastMessageAt * 1000).toLocaleString("zh-CN", { hour12: false })}</span>
                  </div>
                  <div className="truncate text-[14px] text-ink">{t.title}</div>
                </div>
                {me && me.unread > 0 && (
                  <span className="rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-2 py-0.5 text-[11px] font-medium text-white">
                    {me.unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
