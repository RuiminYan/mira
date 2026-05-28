import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getTicket,
  listMessages,
  categoryLabel,
  statusLabel,
  priorityLabel,
} from "@/lib/tickets";
import { replyTicket, verifyTicketAction } from "@/app/actions/tickets";

type Params = Promise<{ id: string }>;
type Search = Promise<{ token?: string; ok?: string; err?: string }>;

export const metadata = { title: "工单详情" };

export default async function MyTicketDetail({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const p = await params;
  const sp = await searchParams;
  const me = await getCurrentUser();
  const id = Number(p.id);
  const t = getTicket(id);
  if (!t) notFound();

  const isOwner = !!me && (t.userId === me.id || me.role === "admin");
  const isAnonymousUnverified = t.status === "unverified" && !t.userId;
  const providedToken = sp.token?.trim() || "";
  const hasValidToken =
    isAnonymousUnverified && providedToken.length > 0 && providedToken === t.verifyToken;

  // 普通用户(非 owner)且不是匿名 token 路径 → 跳登录
  if (!isOwner && !isAnonymousUnverified) {
    if (!me) redirect(`/login?next=/help/tickets/${p.id}`);
    redirect("/help/tickets");
  }

  const messages = listMessages(id);

  return (
    <section className="container-page max-w-3xl py-12 md:py-16">
      <Link href="/help/tickets" className="text-[13px] text-ink-3 hover:text-ink">
        ← 我的工单
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] text-ink-3 mb-1">
            #{t.id} · {categoryLabel(t.category)} · 优先级 {priorityLabel(t.priority)}
          </div>
          <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight">{t.subject}</h1>
          <div className="mt-1.5 text-[12.5px] text-ink-3">
            提交时间 · {new Date(t.createdAt * 1000).toLocaleString("zh-CN")}
          </div>
        </div>
        <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] text-ink-2">
          {statusLabel(t.status)}
        </span>
      </div>

      {sp.ok === "verified" && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[12.5px] text-emerald-200">
          已验证成功,客服会在 24 小时内回复。
        </div>
      )}

      {isAnonymousUnverified && hasValidToken && t.status === "unverified" && (
        <div className="mt-6 glass rounded-[14px] p-5">
          <div className="text-[12.5px] uppercase tracking-widest text-ink-3 mb-2">
            请保存以下验证链接
          </div>
          <p className="text-[13.5px] text-ink-3 mb-3">
            这是匿名工单。请把下方链接保存到邮箱或浏览器书签,以便后续追踪进度;点击「验证」即可激活工单进入处理队列。
          </p>
          <div className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[12px] font-mono text-ink-2 break-all">
            /help/tickets/{t.id}?token={t.verifyToken}
          </div>
          <form action={verifyTicketAction} className="mt-4 flex gap-2">
            <input type="hidden" name="ticketId" value={t.id} />
            <input type="hidden" name="token" value={t.verifyToken ?? ""} />
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13.5px] font-medium text-white"
            >
              验证并提交
            </button>
          </form>
          {sp.err === "token" && (
            <div className="mt-3 text-[12.5px] text-amber-300">验证链接无效。</div>
          )}
        </div>
      )}

      {isAnonymousUnverified && !hasValidToken && (
        <div className="mt-6 glass rounded-[14px] p-5 text-[13.5px] text-ink-3">
          需要带上正确的验证 token 才能查看。请回到提交工单时保存的链接。
        </div>
      )}

      {t.status !== "unverified" && (
        <>
          <div className="mt-8 space-y-4">
            {messages.map((m) => {
              const mine = m.fromRole === "user";
              return (
                <div
                  key={m.id}
                  className={
                    "glass rounded-[12px] p-4 max-w-[88%] " +
                    (mine ? "ml-auto bg-brand-soft/30" : "")
                  }
                >
                  <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">
                    {m.fromRole === "admin" ? "Mira 客服" : m.fromRole === "system" ? "系统" : "我"} ·{" "}
                    {new Date(m.createdAt * 1000).toLocaleString("zh-CN")}
                  </div>
                  <div className="text-[14px] leading-7 text-ink-2 whitespace-pre-wrap">
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>

          {t.status === "closed" ? (
            <div className="mt-8 glass rounded-[12px] p-5 text-[13px] text-ink-3">
              工单已关闭。如有新问题请
              <Link href="/help/contact" className="ml-1 text-brand hover:underline">
                提交新工单
              </Link>
              。
            </div>
          ) : (
            isOwner && (
              <form action={replyTicket} className="mt-8 glass rounded-[14px] p-5">
                <input type="hidden" name="ticketId" value={t.id} />
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-ink-3">追加回复</span>
                  <textarea
                    required
                    name="body"
                    rows={5}
                    maxLength={5000}
                    className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70 leading-7"
                    placeholder="补充更多信息……"
                  />
                </label>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2 text-[13.5px] font-medium text-white"
                  >
                    发送
                  </button>
                </div>
              </form>
            )
          )}
        </>
      )}
    </section>
  );
}
