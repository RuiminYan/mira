import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES, getArticleBySlug, neighbors } from "@/lib/insights";
import { getLocale, t } from "@/lib/i18n";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const a = getArticleBySlug(p.slug);
  if (!a) return { title: "Article" };
  return {
    title: a.title,
    description: a.excerpt,
    openGraph: {
      title: a.title,
      description: a.excerpt,
      type: "article",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt,
      images: ["/twitter-image"],
    },
  };
}

function fmtDate(s: string): string {
  return s.replace(/-/g, ".");
}

export default async function InsightDetail({ params }: { params: Params }) {
  const p = await params;
  const a = getArticleBySlug(p.slug);
  if (!a) notFound();
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const { prev, next } = neighbors(p.slug);

  // JSON-LD for article
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.publishedAt,
    author: { "@type": "Organization", name: a.author },
    publisher: {
      "@type": "Organization",
      name: "Mira 镜界",
      logo: { "@type": "ImageObject", url: "/icon" },
    },
    mainEntityOfPage: `/insights/${a.slug}`,
    keywords: (a.tags || []).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="relative" style={{ background: a.hero, minHeight: 280 }}>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="container-page relative pt-12 md:pt-16 pb-20 md:pb-28">
          <Link href="/insights" className="text-[13px] text-white/80 hover:text-white">
            {tr("insights.back")}
          </Link>
          <div className="mt-6 text-[11px] uppercase tracking-widest text-white/80">
            {a.category}
          </div>
          <h1 className="mt-3 text-balance text-[34px] md:text-[50px] font-semibold text-white leading-tight max-w-3xl">
            {a.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/80">
            <span>{a.author}</span>
            <span>{fmtDate(a.publishedAt)}</span>
            <span>{tr("insights.reading", { n: a.readingMin })}</span>
          </div>
          {a.tags && a.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.tags.map((tg) => (
                <Link
                  key={tg}
                  href={`/insights?tag=${encodeURIComponent(tg)}`}
                  className="rounded-md bg-white/10 px-2 py-0.5 text-[11.5px] text-white/90 hover:bg-white/20"
                >
                  #{tg}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <article className="container-page max-w-3xl py-12 md:py-16">
        <div className="text-[17px] leading-[1.8] text-ink-2">{a.body()}</div>

        <div className="grid gap-4 md:grid-cols-2 my-12">
          {prev ? (
            <Link
              href={`/insights/${prev.slug}`}
              className="glass rounded-[12px] p-5 hover:bg-white/[0.06]"
            >
              <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">← 上一篇</div>
              <div className="text-[14px] text-ink font-medium leading-snug">{prev.title}</div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/insights/${next.slug}`}
              className="glass rounded-[12px] p-5 hover:bg-white/[0.06] text-right md:text-left"
            >
              <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">下一篇 →</div>
              <div className="text-[14px] text-ink font-medium leading-snug">{next.title}</div>
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div className="rounded-[14px] p-8 md:p-10 glow-ring glass">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">下一个 case 是你</div>
          <h3 className="text-[24px] md:text-[28px] font-semibold leading-tight">
            想成为下一个案例?<span className="text-gradient">立刻上链</span>
          </h3>
          <p className="mt-3 text-[14px] leading-7 text-ink-3 max-w-xl">
            把你的脸授权给 Mira,平台帮你接单 / 结算 / 维权。
            我们会按季度发布最新案例研究,你可能就是下一期主角。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
            >
              联系我们 →
            </Link>
            <Link
              href="/marketplace"
              className="rounded-md border border-line-2 px-5 py-2.5 text-[14px] font-medium text-ink-2 hover:text-ink"
            >
              浏览选角广场
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
