import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  getTicket,
  listMessages,
  categoryLabel,
  statusLabel,
  priorityLabel,
  TICKET_STATUS_LIST,
} from "@/lib/tickets";
import { assignSelf, changeTicketStatus, replyTicket } from "@/app/actions/tickets";

type Params = Promise<{ id: string }>;

export const metadata = { title: "工单详情" };

export default async function AdminTicketDetail({ params }: { params: Params }) {
  const p = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?role=admin&next=/admin/tickets/${p.id}`);
  if (me.role !== "admin") redirect("/");

  const id = Number(p.id);
  const t = getTicket(id);
  if (!t) notFound();
  const messages = listMessages(id);
  let owner: { id: number; nickname: string; email: string } | null = null;
  if (t.userId) {
    const u = db.select().from(schema.users).where(eq(schema.users.id, t.userId)).get();
    if (u) owner = { id: u.id, nickname: u.nickname, email: u.email };
  }
  let assignee: { nickname: string } | null = null;
  if (t.assignedTo) {
    const u = db.select().from(schema.users).where(eq(schema.users.id, t.assignedTo)).get();
    if (u) assignee = { nickname: u.nickname };
  }

  return (
    <section className="container-page max-w-5xl py-10 md:py-14">
      <Link href="/admin/tickets" className="text-[13px] text-ink-3 hover:text-ink">
        ← 工单列表
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[12px] text-ink-3 mb-1.5">
                #{t.id} · {categoryLabel(t.category)} · 优先级 {priorityLabel(t.priority)}
              </div>
              <h1 className="text-[24px] md:text-[28px] font-semibold leading-tight">{t.subject}</h1>
              <div className="mt-1.5 text-[12.5px] text-ink-3">
                提交时间 {new Date(t.createdAt * 1000).toLocaleString("zh-CN")}
              </div>
            </div>
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] text-ink-2">
              {statusLabel(t.status)}
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {messages.map((m) => {
              const adminMsg = m.fromRole === "admin";
              return (
                <div
                  key={m.id}
                  className={
                    "glass rounded-[12px] p-4 max-w-[88%] " +
                    (adminMsg ? "ml-auto bg-brand-soft/30" : "")
                  }
                >
                  <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">
                    {m.fromRole === "admin" ? "Mira 客服" : m.fromRole === "system" ? "系统" : "用户"} ·{" "}
                    {new Date(m.createdAt * 1000).toLocaleString("zh-CN")}
                  </div>
                  <div className="text-[14px] leading-7 text-ink-2 whitespace-pre-wrap">{m.body}</div>
                </div>
              );
            })}
          </div>

          <form action={replyTicket} className="mt-8 glass rounded-[14px] p-5">
            <input type="hidden" name="ticketId" value={t.id} />
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-ink-3">客服回复</span>
              <textarea
                required
                name="body"
                rows={6}
                maxLength={5000}
                className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70 leading-7"
                placeholder="给用户的答复……"
              />
            </label>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2 text-[13.5px] font-medium text-white"
              >
                发送回复
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-[12px] p-4 text-[13px]">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">联系方式</div>
            <div className="text-ink">{t.contactName || "(未填写)"}</div>
            <div className="text-ink-3">{t.contactEmail}</div>
            {owner && (
              <div className="mt-2 text-ink-3">
                绑定账号 · {owner.nickname} (uid {owner.id})
              </div>
            )}
            {!owner && (
              <div className="mt-2 text-ink-4">匿名工单</div>
            )}
          </div>

          <div className="glass rounded-[12px] p-4 text-[13px]">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">处理人</div>
            <div className="text-ink">{assignee?.nickname ?? "未分配"}</div>
            <form action={assignSelf} className="mt-3">
              <input type="hidden" name="ticketId" value={t.id} />
              <button
                type="submit"
                className="w-full rounded-md border border-line-2 px-3 py-1.5 text-[12.5px] hover:border-brand/60"
              >
                指派给我
              </button>
            </form>
          </div>

          <div className="glass rounded-[12px] p-4 text-[13px]">
            <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">更新状态</div>
            <form action={changeTicketStatus} className="space-y-2">
              <input type="hidden" name="ticketId" value={t.id} />
              <select
                name="status"
                defaultValue={t.status}
                className="w-full rounded-md border border-line bg-bg/40 px-2.5 py-2 text-[13px] text-ink outline-none focus:border-brand/70"
              >
                {TICKET_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-3 py-1.5 text-[12.5px] font-medium text-white"
              >
                应用
              </button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}
