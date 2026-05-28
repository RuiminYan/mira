import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Image, Video, Mic, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCredits, recentJobs, JOB_COSTS, effectiveJobStatus } from "@/lib/studio";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("studio.title", locale);
  const description = t("studio.subtitle", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
  };
}

export default async function StudioHomePage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio");
  if (u.role === "admin") redirect("/admin/studio");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const credits = getCredits(u.id);
  const recent = recentJobs(u.id, 3);

  const kinds: { kind: "image" | "video" | "tts"; icon: typeof Image }[] = [
    { kind: "image", icon: Image },
    { kind: "video", icon: Video },
    { kind: "tts", icon: Mic },
  ];

  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2 inline-flex items-center gap-2">
            <Sparkles size={14} /> {tr("studio.eyebrow")}
          </div>
          <h1 className="text-[30px] md:text-[40px] font-semibold leading-tight">
            <span className="text-gradient">{tr("studio.heading.em")}</span>
          </h1>
          <p className="text-ink-3 text-[14px] mt-2 max-w-xl leading-6">{tr("studio.subtitle")}</p>
        </div>
        <div className="glass rounded-[12px] px-5 py-3">
          <div className="text-[11px] uppercase tracking-widest text-ink-3">{tr("studio.balance")}</div>
          <div className="text-[22px] font-semibold text-gradient leading-none mt-1.5">
            {credits.balance.toLocaleString()}
          </div>
          <Link href="/studio/credits" className="text-[12px] text-brand hover:underline mt-2 inline-block">
            {tr("studio.recharge")} →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3" data-tour="studio-kinds">
        {kinds.map(({ kind, icon: Icon }) => (
          <Link
            key={kind}
            href={`/studio/jobs/new?kind=${kind}`}
            className="glass rounded-[14px] p-6 hover:bg-white/[0.06] transition group"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] text-white">
              <Icon size={18} />
            </div>
            <div className="text-[18px] font-semibold text-ink mb-1">{tr(`studio.kind.${kind}`)}</div>
            <div className="text-[13px] text-ink-3 leading-6">{tr(`studio.kind.${kind}.desc`)}</div>
            <div className="mt-4 text-[12px] text-ink-4">{tr("studio.new.cost", { credits: JOB_COSTS[kind] })}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] uppercase tracking-widest text-ink-3">{tr("studio.recent")}</div>
          <Link href="/studio/jobs" className="text-[12px] text-brand hover:underline">
            {tr("common.viewAll")} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="glass rounded-[14px] p-8 text-center text-[13.5px] text-ink-3">
            {tr("studio.no_recent")}
          </div>
        ) : (
          <div className="grid gap-3">
            {recent.map((j) => {
              const st = effectiveJobStatus(j);
              return (
                <Link
                  key={j.id}
                  href={`/studio/jobs/${j.id}`}
                  className="glass rounded-[12px] p-4 flex items-center justify-between gap-4 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-ink truncate">{j.prompt}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">
                      {tr(`studio.kind.${j.kind}`)} · {tr(`studio.status.${st}`)} · {j.costCredits} c
                    </div>
                  </div>
                  <div className="text-[11px] text-ink-4 shrink-0">
                    {new Date(j.createdAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
