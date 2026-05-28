import { ARTICLES } from "@/lib/insights";
import { siteBaseUrl } from "@/lib/seo";

export const runtime = "nodejs";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = siteBaseUrl();
  const items = [...ARTICLES]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((a) => {
      const link = `${base}/insights/${a.slug}`;
      const pub = new Date(a.publishedAt).toUTCString();
      const cat = (a.tags || []).concat(a.category);
      return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <author>${xmlEscape(a.author)}</author>
      ${cat.map((c) => `<category>${xmlEscape(c)}</category>`).join("\n      ")}
      <description><![CDATA[${a.excerpt}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mira 镜界 · 洞察</title>
    <link>${base}/insights</link>
    <atom:link href="${base}/insights/rss.xml" rel="self" type="application/rss+xml" />
    <description>AI 演员 / 人脸 IP 授权 / 行业研究 / 合规与案例</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
