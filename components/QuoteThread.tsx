import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { db, schema } from "@/db";
import { acceptQuote, counterQuote, rejectQuote } from "@/app/actions/bundles";
import type { Quote, User } from "@/db/schema";

const STATUS_LABEL: Record<string, string> = {
  submitted: "已发出",
  counter: "对方还价",
  accepted: "已成交",
  rejected: "已拒绝",
  expired: "已过期",
};
const STATUS_TONE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-300",
  counter: "bg-sky-500/15 text-sky-300",
  accepted: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-white/[0.08] text-ink-3",
  expired: "bg-white/[0.08] text-ink-3",
};

export function QuoteThread({
  quote,
  me,
  backHref,
}: {
  quote: Quote;
  me: User;
  backHref: string;
}) {
  const target =
    quote.talentId
      ? db.select().from(schema.talents).where(eq(schema.talents.id, quote.talentId)).get()
      : null;
  const bundle =
    quote.bundleId
      ? db.select().from(schema.bundles).where(eq(schema.bundles.id, quote.bundleId)).get()
      : null;
  const partner = db.select().from(schema.users).where(eq(schema.users.id, quote.partnerId)).get();
  const creator = quote.creatorId
    ? db.select().from(schema.users).where(eq(schema.users.id, quote.creatorId)).get()
    : null;

  const msgs = db
    .select()
    .from(schema.quoteMessages)
    .where(eq(schema.quoteMessages.quoteId, quote.id))
    .orderBy(asc(schema.quoteMessages.createdAt))
    .all();

  const isPartner = quote.partnerId === me.id;
  const canAct = ["submitted", "counter"].includes(quote.status) && (isPartner || quote.creatorId === me.id);
  const myTurn =
    canAct &&
    ((isPartner && quote.lastMessageBy === "creator") ||
      (!isPartner && quote.lastMessageBy === "partner") ||
      quote.status === "submitted");

  return (
    <section className="container-page py-12 md:py-16">
      <Link href={backHref} className="text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" /> 返回议价列表
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Quote #{quote.id}</div>
          <h1 className="text-[24px] font-semibold leading-tight md:text-[28px]">{quote.projectName}</h1>
          <div className="mt-1 text-[13px] text-ink-3">{quote.scope}</div>
        </div>
        <div className="text-right">
          <span className={"inline-flex rounded-full px-3 py-1 text-[12px] " + (STATUS_TONE[quote.status] ?? "")}>
            {STATUS_LABEL[quote.status] ?? quote.status}
          </span>
          <div className="mt-2 text-[20px] font-semibold text-ink">¥{quote.offerAmount.toLocaleString()}</div>
          <div className="text-[11px] text-ink-3">分账 {quote.offerShare}%</div>
        </div>
      </div>

      <div className="mt-6 glass rounded-[14px] p-5 text-[12.5px] text-ink-3">
        <div className="flex flex-wrap gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-4">议价目标</div>
            <div className="text-ink-2">
              {target ? target.stageName : null}
              {bundle ? `套餐 · ${bundle.name}` : null}
              {!target && !bundle ? "—" : null}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-4">制作方</div>
            <div className="text-ink-2">{partner?.nickname ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-4">创作者</div>
            <div className="text-ink-2">{creator?.nickname ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-3">
          <div className="text-[12px] uppercase tracking-widest text-ink-3">议价时间线</div>
          {msgs.map((m, i) => {
            const fromMe = m.fromUserId === me.id;
            return (
              <div
                key={m.id}
                className={"flex " + (fromMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={
                    "max-w-[85%] rounded-[12px] px-4 py-3 text-[13px] leading-6 " +
                    (fromMe
                      ? "bg-gradient-to-br from-[#6E59F6]/30 to-[#FF6FB4]/20 border border-brand/30 text-ink"
                      : "glass text-ink-2")
                  }
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-ink-3">
                    <span>{fromMe ? "我" : isPartner ? "创作者" : "制作方"} · 第 {i + 1} 轮</span>
                    <span>{new Date(m.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}</span>
                  </div>
                  <div className="text-[15px] font-semibold text-ink">
                    ¥{m.amount.toLocaleString()} · 分账 {m.share}%
                  </div>
                  {m.note && <div className="mt-1 text-ink-2">{m.note}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4">
          {canAct && myTurn ? (
            <form action={counterQuote} className="glass grid gap-3 rounded-[14px] p-5">
              <div className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest text-ink-3">
                <MessageCircle size={14} /> 还价 / 回复
              </div>
              <input type="hidden" name="id" value={quote.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  name="amount"
                  label="新报价(¥)"
                  type="number"
                  defaultValue={String(quote.offerAmount)}
                  required
                />
                <Field
                  name="share"
                  label="分账(%)"
                  type="number"
                  defaultValue={String(quote.offerShare)}
                  required
                />
              </div>
              <label className="grid gap-1.5">
                <span className="text-[12px] uppercase tracking-widest text-ink-3">备注</span>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="可补充档期 / 用途说明"
                  className="rounded-md border border-line bg-bg/40 px-3 py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
                />
              </label>
              <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110">
                提交还价
              </button>
            </form>
          ) : canAct ? (
            <div className="glass rounded-[14px] p-5 text-[13px] text-ink-3">
              已发出报价 · 等待对方回复。
            </div>
          ) : null}

          {canAct && (
            <div className="grid gap-2">
              <form action={acceptQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500/85 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-500">
                  <CheckCircle2 size={14} /> 接受当前条款 · 自动建单
                </button>
              </form>
              <form action={rejectQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-line-2 bg-white/[0.04] px-4 py-2 text-[13px] text-ink-3 hover:text-ink">
                  <XCircle size={14} /> 拒绝议价
                </button>
              </form>
            </div>
          )}

          {target && (
            <Link
              href={`/marketplace/${target.id}`}
              className="glass rounded-[14px] p-4 text-[13px] text-ink-2 hover:bg-white/[0.04]"
            >
              查看议价目标:{target.stageName}
            </Link>
          )}
          {bundle && (
            <Link
              href={`/marketplace/bundles/${bundle.id}`}
              className="glass rounded-[14px] p-4 text-[13px] text-ink-2 hover:bg-white/[0.04]"
            >
              查看套餐:{bundle.name}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] uppercase tracking-widest text-ink-3">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="rounded-md border border-line bg-bg/40 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-brand/70"
      />
    </label>
  );
}
