import type { Metadata } from "next";
import Link from "next/link";
import { HELP_ARTICLES, helpAllVoteSummary, topHelpfulHelp } from "@/lib/help";
import { HelpSearch } from "@/components/HelpSearch";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("help.title", locale);
  const description = t("help.subtitle", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
  };
}

export default async function HelpPage() {
  const locale = await getLocale();
  const tr = (k: string) => t(k, locale);
  const voteMap = helpAllVoteSummary();
  const hottest = topHelpfulHelp(6);

  return (
    <section className="container-page py-12 md:py-16">
      <div className="mb-3 text-[12px] uppercase tracking-widest text-ink-3">
        {tr("common.help")}
      </div>
      <h1 className="text-[32px] md:text-[42px] font-semibold leading-tight">
        <span className="text-gradient">{tr("help.title")}</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-3">{tr("help.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-3 text-[13px]">
        <Link
          href="/help/contact"
          className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 font-medium text-white"
        >
          {locale === "en" ? "Open a ticket" : "提交工单"} →
        </Link>
        <Link
          href="/help/tickets"
          className="rounded-md border border-line-2 px-4 py-2 text-ink-2 hover:text-ink"
        >
          {locale === "en" ? "My tickets" : "我的工单"}
        </Link>
      </div>

      {hottest.length > 0 && (
        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">
            {locale === "en" ? "Most helpful" : "本周最多人觉得有用"}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hottest.map((h) => (
              <Link
                key={h.article.slug}
                href={`/help/${h.article.slug}`}
                className="glass rounded-[12px] p-4 hover:bg-white/[0.06] transition"
              >
                <div className="text-[14px] font-semibold text-ink leading-snug">
                  {locale === "en" ? h.article.question.en : h.article.question.zh}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-3">
                  <span>{locale === "en" ? "Helpful" : "有用"} · {h.up}</span>
                  <span>·</span>
                  <span>{locale === "en" ? "Not yet" : "需改进"} · {h.down}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <HelpSearch
          articles={HELP_ARTICLES}
          locale={locale}
          voteMap={voteMap}
          labels={{
            searchPlaceholder: tr("help.search.placeholder"),
            empty: tr("help.empty"),
            all: tr("insights.all"),
            up: locale === "en" ? "Helpful" : "有用",
            down: locale === "en" ? "Needs work" : "需改进",
            catLabels: {
              start: tr("help.cat.start"),
              creator: tr("help.cat.creator"),
              partner: tr("help.cat.partner"),
              mcn: tr("help.cat.mcn"),
              legal: tr("help.cat.legal"),
              billing: tr("help.cat.billing"),
            },
          }}
        />
      </div>

      <div className="mt-16 glass rounded-[16px] p-8 md:p-10 max-w-2xl">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">
          {tr("help.notfound.title")}
        </div>
        <h2 className="text-[20px] font-semibold leading-tight text-ink">
          {tr("help.notfound.body")}
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/help/contact"
            className="inline-flex items-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[13.5px] font-medium text-white hover:brightness-110"
          >
            {locale === "en" ? "Open a ticket" : "提交工单"} →
          </Link>
          <a
            href="mailto:hello@mira.test?subject=Mira%20support"
            className="inline-flex items-center rounded-md border border-line-2 px-5 py-2.5 text-[13.5px] text-ink-2 hover:text-ink"
          >
            {tr("help.notfound.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
