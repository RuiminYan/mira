import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Send } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { sendMessage } from "@/app/actions/messages";

export const metadata = { title: "对话" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/messages");
  const p = await params;
  const id = Number(p.id);
  const t = db.select().from(schema.threads).where(eq(schema.threads.id, id)).get();
  if (!t) notFound();
  const me = db
    .select()
    .from(schema.threadParticipants)
    .where(
      and(eq(schema.threadParticipants.threadId, id), eq(schema.threadParticipants.userId, u.id))
    )
    .get();
  if (!me && u.role !== "admin") redirect("/messages");

  // clear unread on view
  if (me && me.unread > 0) {
    db.update(schema.threadParticipants)
      .set({ unread: 0 })
      .where(eq(schema.threadParticipants.id, me.id))
      .run();
  }

  const msgs = db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.threadId, id))
    .orderBy(asc(schema.messages.createdAt))
    .all();

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/messages" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回消息中心
      </Link>
      <h1 className="mt-4 text-[22px] font-semibold leading-tight md:text-[26px]">{t.title}</h1>

      <div className="mt-6 grid gap-3">
        {msgs.length === 0 ? (
          <div className="glass rounded-[14px] p-6 text-center text-[13px] text-ink-3">
            还没有消息 · 你可以先开口。
          </div>
        ) : (
          msgs.map((m) => {
            const fromMe = m.fromUserId === u.id;
            const isSystem = !m.fromUserId;
            return (
              <div
                key={m.id}
                className={
                  "flex " +
                  (isSystem ? "justify-center" : fromMe ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={
                    "max-w-[85%] rounded-[12px] px-4 py-2.5 text-[14px] leading-6 " +
                    (isSystem
                      ? "bg-white/[0.04] text-[12px] text-ink-3"
                      : fromMe
                        ? "bg-gradient-to-br from-[#6E59F6]/30 to-[#FF6FB4]/20 border border-brand/30 text-ink"
                        : "glass text-ink-2")
                  }
                >
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className="mt-1 text-right text-[10px] text-ink-4">
                    {new Date(m.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form action={sendMessage} className="mt-6 glass grid gap-3 rounded-[14px] p-4">
        <input type="hidden" name="threadId" value={id} />
        <textarea
          name="body"
          rows={3}
          required
          placeholder="写一条消息…"
          className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
        />
        <button className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110">
          <Send size={14} /> 发送
        </button>
      </form>
    </section>
  );
}
