import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { totalJobsCount, totalCreditsUsed, effectiveJobStatus } from "@/lib/studio";
import { getLocale, t } from "@/lib/i18n";

export const metadata = { title: "工坊总览" };

export default async function AdminStudioPage() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/studio");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const totalJobs = totalJobsCount();
  const usedCredits = totalCreditsUsed();
  const byKindRows = db
    .select({
      kind: schema.studioJobs.kind,
      c: sql<number>`count(*)`,
      cost: sql<number>`coalesce(sum(${schema.studioJobs.costCredits}),0)`,
    })
    .from(schema.studioJobs)
    .groupBy(schema.studioJobs.kind)
    .all();

  const recent = db
    .select()
    .from(schema.studioJobs)
    .orderBy(desc(schema.studioJobs.createdAt))
    .limit(30)
    .all();

  const users = new Map<number, string>();
  const talents = new Map<number, string>();
  for (const j of recent) {
    if (!users.has(j.userId)) {
      const r = db.select().from(schema.users).where(eq(schema.users.id, j.userId)).get();
      if (r) users.set(j.userId, r.nickname);
    }
    if (!talents.has(j.talentId)) {
      const r = db.select().from(schema.talents).where(eq(schema.talents.id, j.talentId)).get();
      if (r) talents.set(j.talentId, r.stageName);
    }
  }

  return (
    <section className="container-page py-12 md:py-16">
      <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">
        {tr("studio.eyebrow")}
      </div>
      <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight">
        {tr("studio.admin.title")}
      </h1>
      <p className="mt-2 text-[14px] text-ink-3">{tr("studio.admin.subtitle")}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total jobs" value={totalJobs.toLocaleString()} />
        <Stat label="Total credits used" value={usedCredits.toLocaleString()} />
        <Stat
          label="By kind"
          value={byKindRows.map((r) => `${r.kind}=${r.c}`).join(" · ") || "—"}
        />
      </div>

      <div className="mt-8 glass rounded-[14px] overflow-x-auto">
        <table className="w-full min-w-[680px] text-[13px]">
          <thead className="text-left text-ink-3 text-[11px] uppercase tracking-widest">
            <tr className="border-b border-line">
              <th className="px-5 py-2.5">#</th>
              <th className="px-5 py-2.5">{tr("common.role")}</th>
              <th className="px-5 py-2.5">{tr("common.kind")}</th>
              <th className="px-5 py-2.5">{tr("common.status")}</th>
              <th className="px-5 py-2.5">Talent</th>
              <th className="px-5 py-2.5">{tr("studio.detail.cost")}</th>
              <th className="px-5 py-2.5">{tr("chain.col.time")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((j) => {
              const st = effectiveJobStatus(j);
              return (
                <tr key={j.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-2.5 text-ink">{j.id}</td>
                  <td className="px-5 py-2.5 text-ink-2">{users.get(j.userId) ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-2">{tr(`studio.kind.${j.kind}`)}</td>
                  <td className="px-5 py-2.5 text-ink-2">{tr(`studio.status.${st}`)}</td>
                  <td className="px-5 py-2.5 text-ink-2">{talents.get(j.talentId) ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink">{j.costCredits} c</td>
                  <td className="px-5 py-2.5 text-ink-3 text-[12px]">
                    {new Date(j.createdAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-[14px] p-5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">{label}</div>
      <div className="text-[22px] font-semibold text-gradient leading-none truncate">{value}</div>
    </div>
  );
}
