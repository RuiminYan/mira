import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles, Briefcase, Shield, Network } from "lucide-react";
import { loginOrRegister, getCurrentUser } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { bindReferral } from "@/lib/referral";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("login.title", locale);
  const description = t("login.body", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
  };
}

type Search = Promise<{ role?: string; next?: string; ref?: string }>;

type Role = "creator" | "partner" | "admin" | "mcn";

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const sp = await searchParams;
  const role: Role =
    sp.role === "partner" || sp.role === "admin" || sp.role === "mcn"
      ? (sp.role as Role)
      : "creator";
  const next =
    sp.next ||
    (role === "partner"
      ? "/partner"
      : role === "admin"
        ? "/admin"
        : role === "mcn"
          ? "/mcn"
          : "/creator");

  const u = await getCurrentUser();
  if (u) redirect(next);

  const ref = sp.ref ?? "";

  async function login(formData: FormData) {
    "use server";
    const { db, schema } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const nickname = String(formData.get("nickname") || "");
    const r = (formData.get("role") || "creator") as Role;
    const n = String(formData.get("next") || "/creator");
    const refCode = String(formData.get("ref") || "");
    const before = email
      ? db.select().from(schema.users).where(eq(schema.users.email, email)).get()
      : null;
    const user = await loginOrRegister(email, nickname, r);
    if (refCode && !before) {
      bindReferral(user.id, refCode);
    }
    redirect(n);
  }

  const labelOf = (r: Role) =>
    r === "creator" ? tr("role.creator") : r === "partner" ? tr("role.partner") : r === "admin" ? tr("role.admin") : tr("role.mcn");

  return (
    <section className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-[1fr_1.1fr] items-start">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">{tr("login.title")}</div>
          <h1 className="text-balance text-[34px] md:text-[44px] font-semibold leading-tight">
            {tr("login.heading.pre")}
            <span className="text-gradient">{tr("login.heading.em")}</span>
          </h1>
          <p className="mt-4 text-ink-3 text-[15px] leading-7 max-w-xl">{tr("login.body")}</p>

          <div className="mt-8 grid gap-3">
            <RolePill kind="creator" current={role}>
              <Sparkles size={16} /> {tr("role.identity.creator")}
            </RolePill>
            <RolePill kind="partner" current={role}>
              <Briefcase size={16} /> {tr("role.identity.partner")}
            </RolePill>
            <RolePill kind="admin" current={role}>
              <Shield size={16} /> {tr("role.identity.admin")}
            </RolePill>
            <RolePill kind="mcn" current={role}>
              <Network size={16} /> {tr("role.identity.mcn")}
            </RolePill>
          </div>
        </div>

        <div className="glass rounded-[16px] p-6 md:p-8 glow-ring">
          {ref && (
            <div className="mb-4 rounded-md border border-line-2 bg-white/[0.04] px-3 py-2 text-[12.5px] text-ink-2">
              邀请码 <span className="font-mono text-ink">{ref}</span> 已锁定,注册后将给邀请人发放奖励。
            </div>
          )}
          <form action={login} className="grid gap-4">
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="ref" value={ref} />
            <Field
              label={tr("login.email.label")}
              name="email"
              type="email"
              required
              placeholder={tr("login.email.placeholder")}
            />
            <Field
              label={tr("login.nickname.label")}
              name="nickname"
              placeholder={tr("login.nickname.placeholder")}
            />

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition shadow-[0_10px_30px_-12px_rgba(110,89,246,0.55)]"
            >
              {tr("login.submit", { role: labelOf(role) })}
            </button>
            <p className="text-[12px] text-ink-4 mt-1">{tr("login.hint")}</p>
          </form>
        </div>
      </div>
    </section>
  );
}

function RolePill({
  kind,
  current,
  children,
}: {
  kind: Role;
  current: string;
  children: React.ReactNode;
}) {
  const active = kind === current;
  return (
    <a
      href={`/login?role=${kind}`}
      className={
        "flex items-center gap-2 rounded-md border px-4 py-3 text-[14px] transition " +
        (active
          ? "border-brand bg-brand-soft text-ink"
          : "border-line text-ink-2 hover:border-line-2 hover:text-ink")
      }
    >
      {children}
    </a>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-md bg-bg/40 border border-line focus:border-brand/70 focus:bg-bg/70 outline-none transition px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-4"
      />
    </label>
  );
}
