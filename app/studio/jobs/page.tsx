import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { listJobs, effectiveJobStatus } from "@/lib/studio";
import { getLocale, t } from "@/lib/i18n";

export const metadata = { title: "我的作业" };

export default async function StudioJobsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio/jobs");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const jobs = listJobs(u.id);
  const talents = new Map<number, string>();
  for (const j of jobs) {
    if (!talents.has(j.talentId)) {
      const tl = db.select().from(schema.talents).where(eq(schema.talents.id, j.talentId)).get();
      if (tl) talents.set(j.talentId, tl.stageName);
    }
  }

  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">
            {tr("studio.eyebrow")}
          </div>
          <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight">{tr("studio.jobs.title")}</h1>
        </div>
        <Link
          href="/studio"
          className="rounded-md border border-line-2 px-4 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-white/[0.06]"
        >
          {tr("studio.jobs.new")} →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">{tr("studio.jobs.empty")}</div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => {
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
                    {tr(`studio.kind.${j.kind}`)} · {tr(`studio.status.${st}`)} · {j.costCredits} c · {talents.get(j.talentId) ?? "—"}
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
    </section>
  );
}
