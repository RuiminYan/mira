import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  Briefcase,
  Coins,
  TrendingUp,
  ScanFace,
  Layers,
  Workflow,
  Crown,
  Network,
  FileCheck,
  Megaphone,
} from "lucide-react";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { FeatureCard, StatCard } from "@/components/Card";
import { FaceGrid } from "@/components/FaceGrid";
import { ActivityMarquee } from "@/components/ActivityMarquee";
import { getLocale, t } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { orgJsonLd, websiteJsonLd, jsonLdScript } from "@/lib/seo";
import { featuredArticles } from "@/lib/insights";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = `${t("brand.name", locale)} — ${t("brand.tagline", locale)}`;
  const description = t("brand.description", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
    alternates: { languages: { "zh-CN": "/", en: "/" } },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);

  const THREE_SIDES = [
    { icon: ScanFace, title: tr("home.three.creator.title"), description: tr("home.three.creator.desc") },
    { icon: Briefcase, title: tr("home.three.partner.title"), description: tr("home.three.partner.desc") },
    { icon: Workflow, title: tr("home.three.settle.title"), description: tr("home.three.settle.desc") },
  ];

  const PAIN =
    locale === "en"
      ? [
          { pain: "KOC monetization gap: tens of millions of mid-tier creators have unused likeness assets", cure: "Turn every face into a re-licensable digital asset with passive royalties" },
          { pain: "Studios face compliance cost: slow casting and high legal risk for supporting roles", cure: "Plug-and-play compliant AI casting library; legal boundaries inside the contract" },
          { pain: "Industry gap: face-IP trading, pricing, royalty, attestation infra missing", cure: "Mira builds the face-IP exchange — like music rights, freely tradable" },
        ]
      : [
          { pain: "KOC 变现难:数千万中腰部创作者形象闲置,缺乏变现渠道", cure: "把每张脸变成可重复授权的数字资产,被动收入持续滚出" },
          { pain: "制作方合规成本高:配角选角慢、法律风险大", cure: "合规 AI 配角库即拍即用,法律边界写进智能合约" },
          { pain: "行业空白:人脸 IP 的交易、定价、分账、确权基础设施缺失", cure: "Mira 把人脸 IP 做成像音乐版权一样自由流通的市场" },
        ];

  const MILESTONES =
    locale === "en"
      ? [
          { phase: "01", time: "0–3 mo", title: "Cold start · MVP", text: "Sign 500 KOCs, 20 studios, ¥100 K monthly GMV; ship Web V1.0." },
          { phase: "02", time: "3–12 mo", title: "Growth · validation", text: "Sign 2,000 (200+ exclusive), 100 studios, ¥1 M monthly GMV; plug into RedFruit / Douyin." },
          { phase: "03", time: "12–36 mo", title: "Scale · industry standard", text: "10,000+ KOCs, 500 studios, ¥100 M annual GMV; publish industry whitepaper with Duan & Duan." },
        ]
      : [
          { phase: "01", time: "0–3 月", title: "冷启动 · MVP 验证", text: "签约 KOC 500 人、合作制作方 20 家、月交易额 10 万元,Web V1.0 上线。" },
          { phase: "02", time: "3–12 月", title: "增长 · 模式验证", text: "签约 2,000 人(独家 200+),合作制作方 100 家,月交易额 100 万元,接入红果/抖音生态。" },
          { phase: "03", time: "12–36 月", title: "规模 · 行业标准", text: "签约 10,000+ 人,合作 500 家,年交易额过亿,联合段和段律所发布人脸授权行业标准。" },
        ];

  const platformUsers =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM users`)?.c ?? 0;
  const platformTalents =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM talents WHERE status = 'live'`)
      ?.c ?? 0;
  const platformOrders =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM orders`)?.c ?? 0;
  const platformChain =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM chain_records`)?.c ?? 0;

  const TRUSTED = [
    { name: "段和段律所", tone: "from-indigo-500/30 to-indigo-500/5" },
    { name: "上海仲裁委", tone: "from-sky-500/30 to-sky-500/5" },
    { name: "蚂蚁链", tone: "from-cyan-500/30 to-cyan-500/5" },
    { name: "红果短剧", tone: "from-pink-500/30 to-pink-500/5" },
    { name: "星河短剧工作室", tone: "from-amber-500/30 to-amber-500/5" },
    { name: "寒拾文化 MCN", tone: "from-purple-500/30 to-purple-500/5" },
  ];

  const insights = featuredArticles(3);

  const MOATS = [
    { icon: Network, title: tr("home.moat.network.title"), desc: tr("home.moat.network.desc") },
    { icon: Coins, title: tr("home.moat.data.title"), desc: tr("home.moat.data.desc") },
    { icon: Crown, title: tr("home.moat.crown.title"), desc: tr("home.moat.crown.desc") },
    { icon: FileCheck, title: tr("home.moat.compliance.title"), desc: tr("home.moat.compliance.desc") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(orgJsonLd())} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
      <TopBanner locale={locale} />
      <Hero locale={locale} />

      <section className="border-y border-line bg-white/[0.02]">
        <div className="container-page py-8 md:py-10">
          <div className="text-[11px] uppercase tracking-widest text-ink-4 mb-4 text-center">
            {locale === "en" ? "Trusted by" : "合作 ・ 信任伙伴"}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {TRUSTED.map((p) => (
              <div
                key={p.name}
                className={
                  "rounded-md px-3 py-3 text-center text-[12.5px] text-ink-2 bg-gradient-to-br " +
                  p.tone
                }
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section
        eyebrow={tr("home.three.eyebrow")}
        title={
          <>
            {tr("home.three.title.pre")}
            <span className="text-gradient">{tr("home.three.title.em")}</span>
          </>
        }
        subtitle={tr("home.three.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {THREE_SIDES.map((s) => (
            <FeatureCard key={s.title} icon={s.icon} title={s.title} description={s.description} />
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <FeatureCard
            tone="brand"
            icon={Sparkles}
            title={tr("home.feature.innovation.title")}
            description={tr("home.feature.innovation.desc")}
          />
          <FeatureCard icon={ShieldCheck} title={tr("home.feature.compliance.title")} description={tr("home.feature.compliance.desc")} />
          <FeatureCard icon={Layers} title={tr("home.feature.tier.title")} description={tr("home.feature.tier.desc")} />
          <FeatureCard icon={Megaphone} title={tr("home.feature.distribution.title")} description={tr("home.feature.distribution.desc")} />
        </div>
      </Section>

      <Section tone="raised" eyebrow={tr("home.pain.eyebrow")} title={tr("home.pain.title")}>
        <div className="grid gap-3">
          {PAIN.map((p) => (
            <div
              key={p.pain}
              className="glass rounded-[14px] p-5 md:p-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center"
            >
              <div className="text-[14px] md:text-[15px] leading-7 text-ink-2">
                <span className="text-ink-4 mr-2 text-[11px] uppercase tracking-widest">{tr("home.pain.label.pain")}</span>
                {p.pain}
              </div>
              <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4]">
                <ArrowRight size={14} className="text-white" />
              </div>
              <div className="text-[14px] md:text-[15px] leading-7">
                <span className="text-ink-4 mr-2 text-[11px] uppercase tracking-widest">{tr("home.pain.label.mira")}</span>
                <span className="text-ink">{p.cure}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={tr("home.market.eyebrow")}
        title={
          <>
            {tr("home.market.title.pre")}
            <span className="text-gradient">{tr("home.market.title.em")}</span>
            {tr("home.market.title.post")}
          </>
        }
        subtitle={tr("home.market.subtitle")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            label={locale === "en" ? "Short-drama face license" : "短剧人脸授权"}
            value="¥8–30亿/y"
            hint={locale === "en" ? "1,200 B drama market in 2026 × 5 faces × ¥1,000" : "2026 年微短剧规模破 1200 亿 × 5 张/部 × ¥1000"}
          />
          <StatCard
            icon={Megaphone}
            label={locale === "en" ? "Brand ad face license" : "品牌广告人脸授权"}
            value="¥15–30亿/y"
            hint={locale === "en" ? "Video ads ¥30–50 B × 2 M shots × ¥1,500" : "视频广告 300–500 亿 × 200 万张次 × ¥1500"}
          />
          <StatCard
            icon={Layers}
            label={locale === "en" ? "SAM incl. overseas" : "综合 SAM(含出海)"}
            value="¥18–50亿/y"
            hint={locale === "en" ? "Plus VTubers, game NPCs, cross-border drama" : "叠加虚拟主播、游戏 NPC、出海短剧"}
          />
        </div>

        <div className="mt-6 glass rounded-[14px] p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden md:grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-[13px] uppercase tracking-widest text-ink-3 mb-2">{tr("home.market.insight.label")}</div>
              <p className="text-[15px] md:text-[16px] leading-7 text-ink-2 max-w-3xl">
                {tr("home.market.insight.body")}{" "}
                <span className="text-ink">{tr("home.market.insight.em")}</span>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="raised" eyebrow={tr("home.moat.eyebrow")} title={tr("home.moat.title")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOATS.map((m) => (
            <FeatureCard key={m.title} icon={m.icon} title={m.title} description={m.desc} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow={tr("home.activity.eyebrow")}
        title={
          <>
            {tr("home.activity.title.pre")}
            <span className="text-gradient">{tr("home.activity.title.em")}</span>
          </>
        }
        subtitle={tr("home.activity.subtitle")}
      >
        <ActivityMarquee limit={10} variant="feed" />
      </Section>

      <Section eyebrow={tr("home.milestone.eyebrow")} title={tr("home.milestone.title")} subtitle={tr("home.milestone.subtitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          {MILESTONES.map((m) => (
            <div key={m.phase} className="glass rounded-[14px] p-6 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-25 blur-2xl"
                style={{ background: "radial-gradient(circle, #FF6FB4 0%, transparent 70%)" }}
              />
              <div className="text-[40px] font-semibold text-gradient leading-none">{m.phase}</div>
              <div className="text-[13px] text-ink-3 mt-2">{m.time}</div>
              <div className="text-[17px] font-semibold text-ink mt-4 mb-2">{m.title}</div>
              <p className="text-[14px] leading-6 text-ink-3">{m.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={locale === "en" ? "Live numbers" : "平台实时数据"}
        title={locale === "en" ? "Numbers, not slogans" : "用数字代替口号"}
        subtitle={
          locale === "en"
            ? "Counters refresh on every page load. Visit /transparency for the full report."
            : "刷新页面即重新计数。完整报告见 /transparency。"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard
            icon={Users}
            label={locale === "en" ? "Users" : "累计用户"}
            value={String(platformUsers)}
          />
          <StatCard
            icon={ScanFace}
            label={locale === "en" ? "Live faces" : "在架形象"}
            value={String(platformTalents)}
          />
          <StatCard
            icon={Briefcase}
            label={locale === "en" ? "Orders" : "累计订单"}
            value={String(platformOrders)}
          />
          <StatCard
            icon={Network}
            label={locale === "en" ? "On-chain receipts" : "链上记录"}
            value={String(platformChain)}
          />
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/transparency"
            className="text-[13.5px] text-brand hover:underline"
          >
            {locale === "en" ? "Open transparency report" : "查看透明度报告"} →
          </Link>
        </div>
      </Section>

      <Section
        eyebrow={locale === "en" ? "Featured insights" : "精选洞察"}
        title={locale === "en" ? "Read the research" : "我们对赛道的判断"}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((a) => (
            <Link
              key={a.slug}
              href={`/insights/${a.slug}`}
              className="glass rounded-[14px] overflow-hidden flex flex-col hover:bg-white/[0.06] transition group"
            >
              <div
                className="aspect-[16/9] relative"
                style={{ background: a.hero }}
                aria-hidden
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute left-4 bottom-4 text-[11px] tracking-widest uppercase text-white/90">
                  {a.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-[15.5px] font-semibold text-ink leading-snug mb-2 group-hover:text-gradient">
                  {a.title}
                </div>
                <p className="text-[13px] leading-6 text-ink-3 line-clamp-3">{a.excerpt}</p>
                <div className="mt-3 text-[12px] text-ink-3">
                  {a.publishedAt.replace(/-/g, ".")} ·{" "}
                  {locale === "en" ? `${a.readingMin} min read` : `${a.readingMin} 分钟`}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/insights" className="text-[13.5px] text-brand hover:underline">
            {locale === "en" ? "All insights" : "全部洞察"} →
          </Link>
        </div>
      </Section>

      <CTA locale={locale} />
      {void SITE_NAME}
    </>
  );
}

function Hero({ locale }: { locale: "zh" | "en" }) {
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
      <div className="container-page py-20 md:py-28 grid gap-14 md:grid-cols-[1.1fr_0.9fr] items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[12px] font-medium text-ink-2 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
            {tr("home.hero.badge")}
          </div>
          <h1 className="text-[36px] md:text-[64px] font-semibold leading-[1.05] text-balance text-ink">
            {tr("home.hero.title.1")}
            <br />
            {tr("home.hero.title.2")}
            <br />
            <span className="text-gradient">{tr("home.hero.title.3")}</span>
          </h1>
          <p className="mt-6 text-[15px] md:text-[17px] leading-7 text-ink-3 max-w-xl">{tr("home.hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/marketplace" size="lg" data-tour="marketplace-link">
              {tr("home.hero.cta.market")} <ArrowRight size={16} />
            </Button>
            <Button href="/product" size="lg" variant="secondary">
              {tr("home.hero.cta.product")}
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            <HeroStat value="¥18–50亿" label={tr("home.hero.stat.sam")} />
            <HeroStat value={locale === "en" ? "50M" : "5000万"} label={tr("home.hero.stat.fans")} />
            <HeroStat value={locale === "en" ? "3 mo" : "3 个月"} label={tr("home.hero.stat.mvp")} />
          </div>
        </div>

        <div className="relative">
          <FaceGrid />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[22px] md:text-[26px] font-semibold text-ink">{value}</div>
      <div className="text-[12px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}

function CTA({ locale }: { locale: "zh" | "en" }) {
  const tr = (k: string) => t(k, locale);
  return (
    <section className="py-20 md:py-24">
      <div className="container-page">
        <div className="relative rounded-[24px] p-10 md:p-16 overflow-hidden glass glow-ring">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 80% at 0% 100%, rgba(110,89,246,0.25), transparent 60%), radial-gradient(40% 60% at 100% 0%, rgba(255,111,180,0.20), transparent 60%)",
            }}
          />
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <div className="text-[12px] uppercase tracking-[0.18em] text-ink-3 mb-3">{tr("home.cta.label")}</div>
              <h2 className="text-balance text-[28px] md:text-[40px] font-semibold leading-tight">
                {tr("home.cta.title.pre")}
                <span className="text-gradient">{tr("home.cta.title.em")}</span>
              </h2>
              <p className="mt-4 text-ink-3 text-[15px] leading-7 max-w-xl">{tr("home.cta.body")}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact#creator"
                  className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
                >
                  {tr("home.cta.creator")}
                </Link>
                <Link
                  href="/contact#partner"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line-2 px-5 py-2.5 text-[14px] font-medium hover:bg-white/[0.06] transition"
                >
                  {tr("home.cta.partner")}
                </Link>
                <Link
                  href="/contact#invest"
                  className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-[14px] font-medium text-ink-2 hover:text-ink"
                >
                  {tr("home.cta.invest")} →
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat icon={Users} value="500+" label={tr("home.cta.stat.koc")} />
                <MiniStat icon={Briefcase} value="20+" label={tr("home.cta.stat.studio")} />
                <MiniStat icon={Coins} value="¥10w/mo" label={tr("home.cta.stat.gmv")} />
                <MiniStat icon={Crown} value="¥3000w" label={tr("home.cta.stat.valuation")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopBanner({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="border-b border-line bg-gradient-to-r from-[#6E59F6]/15 via-bg to-[#FF6FB4]/15">
      <div className="container-page py-2.5 flex flex-wrap items-center justify-center gap-3 text-[12.5px] text-ink-2">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-widest text-ink-3">
          {locale === "en" ? "Phase 8" : "Phase 8"}
        </span>
        <span>
          {locale === "en"
            ? "Help center + 30+ FAQ, tickets, transparency report — all live"
            : "帮助中心 30+ FAQ、工单系统、透明度报告 全部上线"}
        </span>
        <Link href="/transparency" className="text-brand hover:underline">
          {locale === "en" ? "See report" : "查看报告"} →
        </Link>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return (
    <div className="glass rounded-[12px] p-4">
      <Icon size={16} className="text-brand-2 mb-2" />
      <div className="text-[20px] font-semibold text-ink leading-none">{value}</div>
      <div className="text-[12px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
