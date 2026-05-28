import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getHelp, HELP_ARTICLES, helpVoteSummary, helpsByCategory } from "@/lib/help";
import { getLocale, t } from "@/lib/i18n";
import { voteHelpArticle } from "@/app/actions/tickets";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ voted?: string; err?: string }>;

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const a = getHelp(p.slug);
  if (!a) return { title: "Help" };
  const locale = await getLocale();
  const title = locale === "en" ? a.question.en : a.question.zh;
  const description = (locale === "en" ? a.body.en : a.body.zh).slice(0, 140);
  return { title, description };
}

export default async function HelpDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const p = await params;
  const sp = await searchParams;
  const a = getHelp(p.slug);
  if (!a) notFound();
  const locale = await getLocale();
  const tr = (k: string) => t(k, locale);
  const summary = helpVoteSummary(a.slug);
  const related = helpsByCategory(a.category)
    .filter((x) => x.slug !== a.slug)
    .slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: locale === "en" ? a.question.en : a.question.zh,
        acceptedAnswer: {
          "@type": "Answer",
          text: locale === "en" ? a.body.en : a.body.zh,
        },
      },
    ],
  };

  return (
    <article className="container-page max-w-3xl py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <Link href="/help" className="text-[13px] text-ink-3 hover:text-ink">
        ← {tr("common.help")}
      </Link>
      <div className="mt-6 mb-3 text-[12px] uppercase tracking-widest text-ink-3">
        {tr(`help.cat.${a.category}`)}
      </div>
      <h1 className="text-[28px] md:text-[36px] font-semibold leading-tight text-ink">
        {locale === "en" ? a.question.en : a.question.zh}
      </h1>
      <div className="mt-6 text-[15.5px] leading-[1.8] text-ink-2 whitespace-pre-wrap">
        {locale === "en" ? a.body.en : a.body.zh}
      </div>

      <div className="mt-10 glass rounded-[14px] p-5">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">
          {locale === "en" ? "Was this helpful?" : "这条回答有帮助吗?"}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={voteHelpArticle}>
            <input type="hidden" name="slug" value={a.slug} />
            <input type="hidden" name="vote" value="up" />
            <button
              type="submit"
              className="rounded-md border border-line-2 px-4 py-2 text-[13px] hover:border-brand/60 hover:text-ink transition"
            >
              {locale === "en" ? "Helpful" : "有用"} · {summary.up}
            </button>
          </form>
          <form action={voteHelpArticle}>
            <input type="hidden" name="slug" value={a.slug} />
            <input type="hidden" name="vote" value="down" />
            <button
              type="submit"
              className="rounded-md border border-line-2 px-4 py-2 text-[13px] hover:border-amber-400/60 hover:text-ink transition"
            >
              {locale === "en" ? "Needs work" : "需改进"} · {summary.down}
            </button>
          </form>
          {sp.voted && (
            <span className="text-[12.5px] text-ink-3">
              {locale === "en" ? "Thanks for your vote." : "已记录,谢谢反馈。"}
            </span>
          )}
          {sp.err === "already_voted" && (
            <span className="text-[12.5px] text-amber-300">
              {locale === "en" ? "You already voted." : "你已投过票了。"}
            </span>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">
            {locale === "en" ? "Related questions" : "同类问题"}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/help/${r.slug}`}
                className="glass rounded-[12px] p-4 hover:bg-white/[0.06] text-[14px] text-ink leading-snug"
              >
                {locale === "en" ? r.question.en : r.question.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 glass rounded-[14px] p-6">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">
          {tr("help.notfound.title")}
        </div>
        <p className="text-[14px] text-ink-2">{tr("help.notfound.body")}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
          <Link
            href="/help/contact"
            className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 font-medium text-white"
          >
            {locale === "en" ? "Open a ticket" : "提交工单"} →
          </Link>
          <a
            href="mailto:hello@mira.test"
            className="rounded-md border border-line-2 px-4 py-2 text-ink-2 hover:text-ink"
          >
            {tr("help.notfound.cta")}
          </a>
        </div>
      </div>
    </article>
  );
}
