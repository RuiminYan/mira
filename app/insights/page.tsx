import Link from "next/link";
import type { Metadata } from "next";
import {
  ARTICLES,
  ARTICLE_CATEGORIES,
  categoryCount,
  listByCategory,
  type Article,
  type ArticleCategory,
} from "@/lib/insights";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("insights.title", locale);
  const description = t("insights.subtitle", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
    alternates: { types: { "application/rss+xml": "/insights/rss.xml" } },
  };
}

type Search = Promise<{ cat?: string; tag?: string }>;

function catLabel(c: ArticleCategory, locale: "zh" | "en") {
  if (locale === "zh") return c;
  return c === "法律"
    ? t("insights.cat.legal", "en")
    : c === "产业"
      ? t("insights.cat.industry", "en")
      : c === "案例"
        ? t("insights.cat.case", "en")
        : t("insights.cat.tech", "en");
}

function fmtDate(s: string): string {
  return s.replace(/-/g, ".");
}

export default async function InsightsHome({ searchParams }: { searchParams: Search }) {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const sp = await searchParams;
  const cat =
    sp.cat && (ARTICLE_CATEGORIES as string[]).includes(sp.cat)
      ? (sp.cat as ArticleCategory)
      : null;
  const tagRaw = (sp.tag || "").trim();
  let list = listByCategory(cat);
  if (tagRaw) {
    list = list.filter((a) => (a.tags || []).includes(tagRaw));
  }
  const allTags = Array.from(
    new Set(ARTICLES.flatMap((a) => a.tags || []))
  ).sort();

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-16 md:py-24">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-[12px] uppercase tracking-widest text-ink-3">
              {tr("insights.eyebrow")}
            </div>
            <Link
              href="/insights/rss.xml"
              className="text-[12px] text-ink-3 hover:text-ink"
            >
              RSS →
            </Link>
          </div>
          <h1 className="text-balance text-[36px] md:text-[52px] font-semibold leading-tight">
            {tr("insights.heading.1")}
            <br />
            <span className="text-gradient">{tr("insights.heading.em")}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] md:text-[17px] text-ink-3 leading-7">
            {tr("insights.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <CatChip
              current={cat}
              value={null}
              label={`${tr("insights.all")} ${ARTICLES.length}`}
            />
            {ARTICLE_CATEGORIES.map((c) => (
              <CatChip
                key={c}
                current={cat}
                value={c}
                label={`${catLabel(c, locale)} ${categoryCount(c)}`}
              />
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {allTags.map((tg) => {
                const active = tagRaw === tg;
                const params = new URLSearchParams();
                if (cat) params.set("cat", cat);
                if (!active) params.set("tag", tg);
                const href = `/insights${params.size ? `?${params.toString()}` : ""}`;
                return (
                  <Link
                    key={tg}
                    href={href}
                    className={
                      "rounded-md px-2.5 py-1 text-[11.5px] " +
                      (active
                        ? "bg-brand text-white"
                        : "border border-line text-ink-3 hover:text-ink")
                    }
                  >
                    #{tg}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-page">
          {list.length === 0 ? (
            <div className="glass rounded-[14px] p-10 text-center text-ink-3">
              {tr("insights.empty")}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <ArticleCard key={a.slug} article={a} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CatChip({
  current,
  value,
  label,
}: {
  current: ArticleCategory | null;
  value: ArticleCategory | null;
  label: string;
}) {
  const active = current === value;
  const href = value ? `/insights?cat=${value}` : "/insights";
  return (
    <Link
      href={href}
      className={
        "rounded-full px-4 py-1.5 text-[13px] border transition " +
        (active
          ? "border-brand bg-brand-soft text-ink"
          : "border-line text-ink-3 hover:border-line-2 hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}

function ArticleCard({ article, locale }: { article: Article; locale: "zh" | "en" }) {
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="glass rounded-[14px] overflow-hidden flex flex-col hover:bg-white/[0.06] transition group"
    >
      <div className="aspect-[16/9] relative" style={{ background: article.hero }} aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute left-4 bottom-4 text-[11px] tracking-widest uppercase text-white/90">
          {catLabel(article.category, locale)}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[16px] font-semibold text-ink leading-snug mb-2 group-hover:text-gradient">
          {article.title}
        </div>
        <p className="text-[13.5px] leading-6 text-ink-3 line-clamp-3 mb-3">{article.excerpt}</p>
        <div className="mt-auto flex items-center justify-between text-[12px] text-ink-3">
          <span className="truncate">{article.author}</span>
          <span>
            {fmtDate(article.publishedAt)} ·{" "}
            {t("insights.reading.short", locale, { n: article.readingMin })}
          </span>
        </div>
      </div>
    </Link>
  );
}
