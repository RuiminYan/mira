import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { submitTicket } from "@/app/actions/tickets";
import {
  TICKET_CATEGORIES,
  categoryLabel,
  priorityLabel,
  type TicketPriority,
} from "@/lib/tickets";

export const metadata: Metadata = {
  title: "提交工单",
  description: "选择类别 + 描述问题,我们会在 24 小时内回复。",
};

type Search = Promise<{ ok?: string; err?: string; category?: string }>;

const PRI: TicketPriority[] = ["low", "normal", "high", "urgent"];

export default async function ContactPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const defaultCat = (sp.category || "other").trim();

  return (
    <section className="container-page max-w-3xl py-12 md:py-16">
      <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">联系我们</div>
      <h1 className="text-[30px] md:text-[40px] font-semibold leading-tight">
        提交工单 <span className="text-gradient">/ 24h 回复</span>
      </h1>
      <p className="mt-3 text-[15px] text-ink-3 max-w-2xl">
        填表后系统会自动创建工单。已登录用户可在「我的工单」追踪进度;匿名用户的回复会发送到登记邮箱。
      </p>

      {sp.ok && (
        <div className="mt-6 rounded-[12px] border border-emerald-400/40 bg-emerald-400/10 p-4 text-[14px] text-emerald-200">
          工单已提交,编号 #{sp.ok}。我们已发送确认邮件,请留意。
        </div>
      )}
      {sp.err && (
        <div className="mt-6 rounded-[12px] border border-amber-400/40 bg-amber-400/10 p-4 text-[14px] text-amber-200">
          {sp.err === "body"
            ? "请描述清楚问题(至少 5 个字符)。"
            : sp.err === "length"
              ? "字段超长,请精简。"
              : "请检查邮箱与主题。"}
        </div>
      )}

      <form action={submitTicket} className="mt-8 glass rounded-[14px] p-5 md:p-7 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="邮箱" required>
            <input
              required
              type="email"
              name="email"
              defaultValue={me?.email ?? ""}
              className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="称呼">
            <input
              type="text"
              name="name"
              defaultValue={me?.nickname ?? ""}
              maxLength={80}
              className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
              placeholder="可选"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="类别">
            <select
              name="category"
              defaultValue={defaultCat}
              className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
            >
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="优先级">
            <select
              name="priority"
              defaultValue="normal"
              className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
            >
              {PRI.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="主题" required>
          <input
            required
            name="subject"
            maxLength={200}
            className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
            placeholder="一句话概括"
          />
        </Field>

        <Field label="详细描述" required>
          <textarea
            required
            name="body"
            rows={8}
            maxLength={5000}
            className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70 leading-7"
            placeholder="发生了什么 / 复现步骤 / 期望结果 / 截图链接"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[12px] text-ink-3">提交即同意我们将这些信息用于客服跟进,不会用于其它用途。</div>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[14px] font-medium text-white hover:brightness-110"
          >
            提交工单
          </button>
        </div>
      </form>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-[14px] p-5">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">已登录用户</div>
          <Link href="/help/tickets" className="text-[15px] text-ink hover:text-brand">
            进入我的工单列表 →
          </Link>
        </div>
        <div className="glass rounded-[14px] p-5">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">先查 FAQ</div>
          <Link href="/help" className="text-[15px] text-ink hover:text-brand">
            浏览 30+ 常见问题 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-ink-3">
        {label}
        {required && <span className="ml-1 text-pink-400">*</span>}
      </span>
      {children}
    </label>
  );
}
