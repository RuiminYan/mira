import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ARTICLES } from "@/lib/insights";
import { HELP_ARTICLES } from "@/lib/help";
import { siteBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/product",
    "/market",
    "/team",
    "/contact",
    "/marketplace",
    "/marketplace/bundles",
    "/insights",
    "/insights/rss.xml",
    "/activity",
    "/chain",
    "/studio",
    "/help",
    "/help/contact",
    "/pricing",
    "/developers",
    "/leaderboard",
    "/transparency",
    "/terms",
    "/privacy",
    "/dpa",
    "/minors",
    "/portrait-license",
  ].map((path) => ({
    url: base + path,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const liveTalents = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.status, "live"))
    .orderBy(desc(schema.talents.createdAt))
    .all();
  const talentRoutes: MetadataRoute.Sitemap = liveTalents.map((t) => ({
    url: `${base}/marketplace/${t.id}`,
    lastModified: new Date(t.createdAt * 1000),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const articleRoutes: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${base}/insights/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const helpRoutes: MetadataRoute.Sitemap = HELP_ARTICLES.map((a) => ({
    url: `${base}/help/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  const bundleRows = db
    .select()
    .from(schema.bundles)
    .where(eq(schema.bundles.status, "live"))
    .all();
  const bundleRoutes: MetadataRoute.Sitemap = bundleRows.map((b) => ({
    url: `${base}/marketplace/bundles/${b.id}`,
    lastModified: new Date(b.createdAt * 1000),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...talentRoutes,
    ...articleRoutes,
    ...helpRoutes,
    ...bundleRoutes,
  ];
}
