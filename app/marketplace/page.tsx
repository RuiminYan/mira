import { desc, eq, and, gte, lte, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import { db, schema } from "@/db";
import { TalentCard } from "@/components/TalentCard";
import { Section } from "@/components/Section";
import { Sparkles, Crown, Camera, Wand2 } from "lucide-react";
import Link from "next/link";
import { cosineByTags } from "@/lib/search";
import { ActivityMarquee } from "@/components/ActivityMarquee";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("market.title", locale);
  const description = t("market.subtitle", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
  };
}

type Search = Promise<{
  q?: string;
  g?: string;
  gd?: string;
  ex?: string;
  pmin?: string;
  pmax?: string;
  sim?: string;
}>;

export default async function MarketplacePage({ searchParams }: { searchParams: Search }) {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const sp = await searchParams;

  const GENDERS = [
    { v: "", label: tr("market.filter.all_genders") },
    { v: "female", label: tr("gender.female") },
    { v: "male", label: tr("gender.male") },
    { v: "neutral", label: tr("gender.neutral") },
  ];
  const GRADES = [
    { v: "", label: tr("market.filter.all_grades") },
    { v: "S", label: tr("grade.S") },
    { v: "A", label: tr("grade.A") },
    { v: "B", label: tr("grade.B") },
  ];

  const filters: SQL[] = [eq(schema.talents.status, "live")];
  if (sp.g) filters.push(eq(schema.talents.gender, sp.g as "female" | "male" | "neutral"));
  if (sp.gd) filters.push(eq(schema.talents.grade, sp.gd as "S" | "A" | "B"));
  if (sp.ex === "1") filters.push(eq(schema.talents.exclusive, true));
  if (sp.pmin) filters.push(gte(schema.talents.priceOnce, Number(sp.pmin)));
  if (sp.pmax) filters.push(lte(schema.talents.priceOnce, Number(sp.pmax)));

  const useSim = sp.sim === "1" && !!sp.q;

  let list = db
    .select()
    .from(schema.talents)
    .where(and(...filters))
    .orderBy(desc(schema.talents.grade), desc(schema.talents.followers))
    .all();

  if (sp.q) {
    const targets = sp.q.split(/[,，、\s]+/g).map((x) => x.trim()).filter(Boolean);
    const ranked = cosineByTags(targets, list);
    if (useSim) {
      list = ranked.map((r) => r.talent);
    } else {
      const keep = new Set(ranked.filter((r) => r.score > 0).map((r) => r.talent.id));
      list = list.filter((t) => keep.has(t.id));
    }
  }

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-12 md:py-16">
          <div className="mb-3 text-[12px] uppercase tracking-widest text-ink-3">{tr("market.eyebrow")}</div>
          <h1
            className="text-balance text-[32px] font-semibold leading-tight md:text-[44px]"
            data-tour="talent-list"
          >
            {tr("market.heading.pre")}
            <span className="text-gradient">{tr("market.heading.em")}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-3">{tr("market.subtitle")}</p>

          <form method="GET" className="mt-8 flex flex-wrap items-end gap-2">
            <FilterField
              name="q"
              label={tr("market.filter.q.label")}
              placeholder={tr("market.filter.q.placeholder")}
              defaultValue={sp.q}
            />
            <FilterSelect
              name="g"
              label={tr("market.filter.gender.label")}
              options={GENDERS}
              defaultValue={sp.g}
            />
            <FilterSelect
              name="gd"
              label={tr("market.filter.grade.label")}
              options={GRADES}
              defaultValue={sp.gd}
            />
            <FilterField name="pmin" label={tr("market.filter.pmin")} placeholder="¥" defaultValue={sp.pmin} type="number" />
            <FilterField name="pmax" label={tr("market.filter.pmax")} placeholder="¥" defaultValue={sp.pmax} type="number" />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[13px] text-ink-2">
              <input
                type="checkbox"
                name="ex"
                value="1"
                defaultChecked={sp.ex === "1"}
                className="accent-[#6E59F6]"
              />
              {tr("market.filter.exclusive")}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[13px] text-ink-2">
              <input
                type="checkbox"
                name="sim"
                value="1"
                defaultChecked={sp.sim === "1"}
                className="accent-[#6E59F6]"
              />
              <Wand2 size={12} /> {tr("market.filter.sim")}
            </label>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2 text-[14px] font-medium text-white transition hover:brightness-110"
            >
              {tr("common.filter")}
            </button>
            <Link href="/marketplace" className="px-2 py-2 text-[13px] text-ink-3 hover:text-ink">
              {tr("common.reset")}
            </Link>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <Crown size={12} /> {tr("grade.S.tag")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={12} /> {tr("grade.A.tag")}
            </span>
            <span>· {tr("market.count", { n: list.length })}</span>
            <Link
              href="/marketplace/bundles"
              className="ml-auto inline-flex items-center gap-1 text-brand hover:underline"
            >
              <Sparkles size={12} /> {tr("market.bundles.cta")}
            </Link>
            <Link
              href="/marketplace/search/face"
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              <Camera size={12} /> {tr("market.face.cta")}
            </Link>
          </div>
        </div>
        <ActivityMarquee limit={5} variant="ticker" />
      </section>

      <Section>
        {list.length === 0 ? (
          <div className="glass rounded-[14px] p-10 text-center text-ink-3">{tr("market.empty")}</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((t) => (
              <TalentCard key={t.id} talent={t} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function FilterField({
  name,
  label,
  placeholder,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] uppercase tracking-widest text-ink-3">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-[140px] rounded-md border border-line bg-bg/40 px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
      />
    </label>
  );
}

function FilterSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { v: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] uppercase tracking-widest text-ink-3">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border border-line bg-bg/40 px-3 py-2 text-[14px] text-ink outline-none focus:border-brand/70"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-bg text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
