import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, type HeaderUser, type HeaderLabels } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeNoFlashScript } from "@/components/ThemeNoFlashScript";
import { SwRegister } from "@/components/SwRegister";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { OnboardingTour } from "@/components/OnboardingTour";
import { CookieConsent } from "@/components/CookieConsent";
import { CommandPalette } from "@/components/CommandPalette";
import { getCurrentUser } from "@/lib/auth";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";
import { getLocale, t, htmlLang, setLocaleAction } from "@/lib/i18n";
import { getA11y, a11yDataAttrs } from "@/lib/a11y";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL("http://127.0.0.1:3200"),
  title: { default: TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await getCurrentUser();
  const locale = await getLocale();
  const a11y = await getA11y();
  const a11yAttrs = a11yDataAttrs(a11y);
  let unread = 0;
  let walletBalance = 0;
  if (u) {
    const row = db
      .select({ c: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, u.id), isNull(schema.notifications.readAt)))
      .get();
    unread = row?.c ?? 0;
    const w = db
      .select()
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, u.id))
      .get();
    walletBalance = w?.balance ?? 0;
  }
  const headerUser: HeaderUser | null = u
    ? { id: u.id, nickname: u.nickname, role: u.role, unread, walletBalance }
    : null;
  const tr = (k: string) => t(k, locale);
  const labels: HeaderLabels = {
    navProduct: tr("nav.product"),
    navMarket: tr("nav.market"),
    navMarketplace: tr("nav.marketplace"),
    navInsights: tr("nav.insights"),
    navStudio: tr("nav.studio"),
    navTeam: tr("nav.team"),
    navContact: tr("nav.contact"),
    navHelp: tr("nav.help"),
    signIn: tr("common.signin"),
    ctaStart: tr("nav.cta.start"),
    openDashboard: tr("nav.openDashboard"),
    signOut: tr("common.signout"),
    identity: tr("common.role"),
    myOrders: tr("common.viewAll") + " · " + tr("nav.marketplace"),
    myRevenue: tr("common.balance"),
    myNfts: tr("nft.my.title"),
    myWallet: tr("nav.wallet"),
    myProfile: tr("nav.myProfile"),
    myInvite: tr("nav.invite"),
    bell: tr("common.notifications"),
    language: tr("common.language"),
    roleCreator: tr("role.creator"),
    rolePartner: tr("role.partner"),
    roleAdmin: tr("role.admin"),
    roleMcn: tr("role.mcn"),
  };
  // Better strings for partner/creator menus (overriding the synthetic ones above)
  labels.myOrders = locale === "en" ? "My orders" : "我的订单";
  labels.myRevenue = locale === "en" ? "My earnings" : "我的收益";

  return (
    <html lang={htmlLang(locale)} suppressHydrationWarning {...a11yAttrs}>
      <head>
        <ThemeNoFlashScript />
      </head>
      <body>
        <a href="#main" className="skip-link">
          {locale === "en" ? "Skip to main content" : "跳过导航 · 直达正文"}
        </a>
        <SiteHeader
          user={headerUser}
          locale={locale}
          labels={labels}
          switchAction={setLocaleAction}
        />
        <CommandPalette />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <SwRegister />
        <PwaInstallButton label={tr("pwa.install")} />
        {headerUser && <OnboardingTour role={headerUser.role} locale={locale} />}
        <CookieConsent />
      </body>
    </html>
  );
}
