import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getCredits, CREDIT_TIERS } from "@/lib/studio";
import { rechargeCredits } from "@/app/actions/studio";
import { getLocale, t } from "@/lib/i18n";

type Search = Promise<{ ok?: string; err?: string }>;

export const metadata = { title: "充值算力" };

export default async function StudioCreditsPage({ searchParams }: { searchParams: Search }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio/credits");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const sp = await searchParams;
  const credits = getCredits(u.id);
  const history = db
    .select()
    .from(schema.studioRecharges)
    .where(eq(schema.studioRecharges.userId, u.id))
    .orderBy(desc(schema.studioRecharges.createdAt))
    .all();

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/studio" className="text-[13px] text-ink-3 hover:text-ink">
        ← {tr("studio.eyebrow")}
      </Link>
      <h1 className="mt-4 text-[28px] md:text-[34px] font-semibold leading-tight">
        {tr("studio.credits.title")}
      </h1>

      {sp.ok && (
        <div className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-[13px] text-emerald-200">
          {tr("common.done")}
        </div>
      )}

      <div className="mt-6 glass rounded-[14px] p-5 max-w-xl">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">
          {tr("studio.credits.balance")}
        </div>
        <div className="text-[28px] font-semibold text-gradient leading-none">
          {credits.balance.toLocaleString()}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CREDIT_TIERS.map((tier) => (
          <form key={tier.id} action={rechargeCredits} className="glass rounded-[14px] p-5">
            <input type="hidden" name="tier" value={tier.id} />
            <div className="text-[13px] text-ink-2">
              {tr(`studio.credits.tier.${tier.id}`)}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-[20px] font-semibold text-ink">
                ¥{tier.rmb.toLocaleString()}
              </div>
              <button
                type="submit"
                className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
              >
                {tr("studio.credits.recharge")}
              </button>
            </div>
          </form>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-3 text-[13px] uppercase tracking-widest text-ink-3">
          {tr("studio.credits.history")}
        </div>
        {history.length === 0 ? (
          <div className="glass rounded-[14px] p-8 text-center text-[13px] text-ink-3">
            {tr("studio.credits.history.empty")}
          </div>
        ) : (
          <div className="glass rounded-[14px] overflow-x-auto">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead className="text-left text-ink-3 text-[11px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-5 py-2.5 font-medium">{tr("common.amount")}</th>
                  <th className="px-5 py-2.5 font-medium">Credits</th>
                  <th className="px-5 py-2.5 font-medium">{tr("chain.col.time")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 text-ink">¥{h.rmb.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-ink-2">+{h.credits.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-ink-3 text-[12px]">
                      {new Date(h.createdAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
