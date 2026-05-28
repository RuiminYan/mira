import { headers } from "next/headers";

// fallback base for dev/preview. In production set MIRA_SITE_URL.
const DEFAULT_BASE = "http://127.0.0.1:3200";

export function siteBaseUrl(): string {
  const env = process.env.MIRA_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith("http")) return env.replace(/\/$/, "");
  return DEFAULT_BASE;
}

export async function inferBaseUrlFromHeaders(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  } catch {
    // ignore — header context may not be available
  }
  return siteBaseUrl();
}

export type OrgJsonLd = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  description?: string;
};

export function orgJsonLd(): OrgJsonLd {
  const base = siteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mira 镜界",
    url: base,
    logo: `${base}/icon`,
    description: "AIGC 时代的数字资产与 IP 创作平台",
    sameAs: [],
  };
}

export type WebSiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  inLanguage: string[];
  potentialAction?: {
    "@type": "SearchAction";
    target: { "@type": "EntryPoint"; urlTemplate: string };
    "query-input": "required name=q";
  };
};

export function websiteJsonLd(): WebSiteJsonLd {
  const base = siteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mira 镜界",
    url: base,
    inLanguage: ["zh-CN", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={q}` },
      "query-input": "required name=q",
    },
  };
}

export type BreadcrumbItem = { name: string; href: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const base = siteBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.href.startsWith("http") ? it.href : `${base}${it.href}`,
    })),
  };
}

export function jsonLdScript(obj: object): { __html: string } {
  return { __html: JSON.stringify(obj) };
}

// canonical absolute path helper
export function abs(path: string): string {
  return `${siteBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
