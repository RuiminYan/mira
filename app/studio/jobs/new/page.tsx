import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getCredits, JOB_COSTS } from "@/lib/studio";
import { submitStudioJob } from "@/app/actions/studio";
import { getNftByTalentId } from "@/lib/nft";
import { getLocale, t } from "@/lib/i18n";
import { createLoader, parseAsString, parseAsInteger } from "nuqs/server";

export const metadata = { title: "新建生成作业" };

const loadSearch = createLoader({
  kind: parseAsString,
  talentId: parseAsInteger,
  err: parseAsString,
});

export default async function NewStudioJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const sp = await loadSearch(searchParams);
  const kind = (sp.kind === "video" || sp.kind === "tts" ? sp.kind : "image") as
    | "image"
    | "video"
    | "tts";
  const defaultTalentId = sp.talentId ?? undefined;
  const cost = JOB_COSTS[kind];
  const credits = getCredits(u.id);

  // pick eligible talents: live + has NFT
  const liveTalents = db
    .select()
    .from(schema.talents)
    .where(and(eq(schema.talents.status, "live"), ne(schema.talents.status, "taken_down")))
    .all();
  const eligible = liveTalents.filter((tl) => getNftByTalentId(tl.id));

  const insufficient = credits.balance < cost;

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/studio" className="text-[13px] text-ink-3 hover:text-ink">
        ← {tr("studio.eyebrow")}
      </Link>
      <h1 className="mt-4 text-[28px] md:text-[34px] font-semibold leading-tight">{tr("studio.new.title")}</h1>
      <div className="mt-2 text-[13px] text-ink-3">
        {tr(`studio.kind.${kind}`)} · {tr("studio.new.cost", { credits: cost })} ·{" "}
        {tr("studio.balance")} {credits.balance.toLocaleString()}
      </div>

      {sp.err && (
        <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[13px] text-amber-200">
          {sp.err === "prompt"
            ? tr("studio.new.prompt") + " · " + tr("common.required")
            : sp.err}
        </div>
      )}

      <form action={submitStudioJob} className="mt-8 grid gap-4 max-w-2xl">
        <input type="hidden" name="kind" value={kind} />
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">
            {tr("studio.new.talent")}
          </span>
          <select
            name="talentId"
            defaultValue={defaultTalentId ?? ""}
            required
            className="rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand/70"
          >
            <option value="" disabled>—</option>
            {eligible.map((tl) => (
              <option key={tl.id} value={tl.id} className="bg-bg text-ink">
                {tl.stageName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">
            {tr("studio.new.prompt")}
          </span>
          <textarea
            name="prompt"
            required
            rows={4}
            minLength={4}
            placeholder={tr("studio.new.prompt.placeholder")}
            className="rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
          />
        </label>

        <button
          type="submit"
          disabled={insufficient || eligible.length === 0}
          className="mt-2 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition disabled:opacity-60"
        >
          {tr("studio.new.submit")}
        </button>
        {insufficient && (
          <div className="text-[12px] text-amber-200">
            {tr("studio.balance")} {credits.balance} &lt; {cost} · <Link href="/studio/credits" className="underline">{tr("studio.recharge")}</Link>
          </div>
        )}
      </form>
    </section>
  );
}
