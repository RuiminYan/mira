import Link from "next/link";
import { getLocale, t } from "@/lib/i18n";

export async function SiteFooter() {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const COLS = [
    {
      title: tr("footer.col.product"),
      items: [
        { href: "/product", label: tr("footer.product.architecture") },
        { href: "/marketplace", label: tr("footer.product.marketplace") },
        { href: "/studio", label: tr("footer.product.studio") },
        { href: "/creator", label: tr("footer.product.creator") },
        { href: "/partner", label: tr("footer.product.partner") },
      ],
    },
    {
      title: tr("footer.col.insights"),
      items: [
        { href: "/insights", label: tr("footer.insights.whitepaper") },
        { href: "/activity", label: tr("footer.insights.activity") },
        { href: "/market", label: tr("footer.insights.market") },
        { href: "/team", label: tr("footer.insights.team") },
        { href: "/chain", label: tr("footer.insights.chain") },
      ],
    },
    {
      title: tr("footer.col.partnership"),
      items: [
        { href: "/contact#creator", label: tr("footer.partnership.creator") },
        { href: "/contact#partner", label: tr("footer.partnership.partner") },
        { href: "/contact#invest", label: tr("footer.partnership.invest") },
      ],
    },
    {
      title: tr("footer.col.help"),
      items: [
        { href: "/help", label: tr("footer.help.center") },
        { href: "/help/contact", label: locale === "en" ? "Open a ticket" : "提交工单" },
        { href: "/help/tickets", label: locale === "en" ? "My tickets" : "我的工单" },
        { href: "/contact", label: tr("footer.help.contact") },
        { href: "/developers", label: locale === "en" ? "Developers · API" : "开发者 · API" },
        { href: "/pricing", label: locale === "en" ? "Pricing" : "定价方案" },
        { href: "/leaderboard", label: locale === "en" ? "Leaderboard" : "排行榜" },
        { href: "/transparency", label: locale === "en" ? "Transparency" : "透明度报告" },
        { href: "/insights/rss.xml", label: "RSS" },
      ],
    },
    {
      title: tr("footer.col.legal"),
      items: [
        { href: "/terms", label: tr("footer.legal.terms") },
        { href: "/privacy", label: tr("footer.legal.privacy") },
        { href: "/portrait-license", label: tr("footer.legal.portrait") },
        { href: "/minors", label: tr("footer.legal.minors") },
        { href: "/dpa", label: tr("footer.legal.dpa") },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page py-14 grid grid-cols-2 gap-10 md:grid-cols-6">
        <div className="col-span-2 md:col-span-1">
          <div className="text-[16px] font-semibold mb-3">
            Mira <span className="text-ink-3 font-normal">镜界</span>
          </div>
          <p className="text-[13px] leading-6 text-ink-3 max-w-xs">{tr("footer.tagline")}</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="text-[13px] font-medium text-ink-2 mb-3">{c.title}</div>
            <ul className="space-y-2 text-[13px] text-ink-3">
              {c.items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="hover:text-ink transition">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page py-5 text-[12px] text-ink-4 flex flex-wrap items-center justify-between gap-2">
          <span>{tr("footer.legal", { year: new Date().getFullYear() })}</span>
          <span>{tr("footer.slogan")}</span>
        </div>
      </div>
    </footer>
  );
}
