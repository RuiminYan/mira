"use client";

import { useState, useTransition } from "react";
import { submitLead, type LeadKind } from "@/app/actions/leads";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  id: string;
  kind: LeadKind;
  title: string;
  subtitle: string;
  accent: "brand" | "pink" | "cyan";
  fields?: { name?: string; contact?: string; message?: string };
};

const ACCENT_BG: Record<Props["accent"], string> = {
  brand: "from-[#6E59F6] to-[#4F3DD8]",
  pink: "from-[#FF6FB4] to-[#6E59F6]",
  cyan: "from-[#22D3EE] to-[#6E59F6]",
};

export function LeadForm({ id, kind, title, subtitle, accent, fields }: Props) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});

  function onSubmit(form: FormData) {
    setState({});
    start(async () => {
      const r = await submitLead(form);
      setState(r.ok ? { ok: true } : { ok: false, error: r.error });
    });
  }

  return (
    <div id={id} className="scroll-mt-24 relative glass rounded-[16px] p-6 md:p-8 overflow-hidden">
      <div
        aria-hidden
        className={"absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br " + ACCENT_BG[accent]}
      />
      <div className="text-[20px] md:text-[22px] font-semibold mb-2">{title}</div>
      <p className="text-[13.5px] leading-6 text-ink-3 mb-6">{subtitle}</p>

      <form action={onSubmit} className="grid gap-3">
        <input type="hidden" name="kind" value={kind} />
        <Field
          label="称呼"
          name="name"
          placeholder={fields?.name ?? "你的姓名 / 团队"}
          required
        />
        <Field
          label="联系方式"
          name="contact"
          placeholder={fields?.contact ?? "微信 / 邮箱 / 手机"}
          required
        />
        <Field
          label="想说的"
          name="message"
          placeholder={fields?.message ?? "可选,简单介绍一下"}
          textarea
        />

        <div className="flex items-center justify-between gap-3 mt-1">
          <Status state={state} />
          <button
            type="submit"
            disabled={pending}
            className={
              "inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[14px] font-medium text-white transition disabled:opacity-50 bg-gradient-to-r " +
              ACCENT_BG[accent] +
              " hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(110,89,246,0.55)]"
            }
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            {pending ? "提交中…" : "提交线索"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  textarea,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-md bg-bg/40 border border-line focus:border-brand/70 focus:bg-bg/70 outline-none transition px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-4";
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input name={name} placeholder={placeholder} required={required} className={cls} />
      )}
    </label>
  );
}

function Status({ state }: { state: { ok?: boolean; error?: string } }) {
  if (state.ok)
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-400">
        <CheckCircle2 size={14} /> 已收到,我们会尽快联系你
      </span>
    );
  if (state.error)
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-rose-400">
        <AlertCircle size={14} /> {state.error}
      </span>
    );
  return <span className="text-[12px] text-ink-4">提交后我们会通过你留的联系方式回复</span>;
}
