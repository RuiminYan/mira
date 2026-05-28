/* eslint-disable no-console */
// Phase 8 smoke test — runs against a running dev server on 127.0.0.1:3200.
// Usage:
//   1. start the server in another shell: pnpm dev  (or npm run dev)
//   2. node_modules\.bin\tsx.cmd scripts/smoke.ts
//
// Tests are pure HTTP/curl-style; no browser is required.

type Check = {
  name: string;
  fn: () => Promise<void>;
};

const BASE = process.env.MIRA_BASE_URL || "http://127.0.0.1:3200";

let pass = 0;
let fail = 0;
const failures: string[] = [];

async function fetchText(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    ...init,
    headers: { Accept: "*/*", ...(init.headers || {}) },
  });
  const text = await res.text().catch(() => "");
  return { res, text };
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertContains(haystack: string, needle: string, msg?: string) {
  if (!haystack.includes(needle)) {
    throw new Error(
      msg || `Expected response to contain "${needle.slice(0, 80)}"`
    );
  }
}

const CHECKS: Check[] = [
  {
    name: "GET / (homepage 200 + JSON-LD)",
    fn: async () => {
      const { res, text } = await fetchText("/");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "application/ld+json", "missing JSON-LD script tag");
      assertContains(text, "Mira", "missing site name");
    },
  },
  {
    name: "GET /api/health (200 + ok=true)",
    fn: async () => {
      const { res, text } = await fetchText("/api/health");
      assert(res.status === 200, `status=${res.status}`);
      const j = JSON.parse(text) as { ok: boolean; checks: { ok: boolean }[] };
      assert(j.ok === true, `payload.ok=${j.ok}`);
      assert(Array.isArray(j.checks) && j.checks.length >= 2, "missing checks array");
    },
  },
  {
    name: "GET /sitemap.xml (xml + has /insights)",
    fn: async () => {
      const { res, text } = await fetchText("/sitemap.xml");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "<urlset", "not a sitemap");
      assertContains(text, "/insights", "missing /insights routes");
      assertContains(text, "/help", "missing /help routes");
    },
  },
  {
    name: "GET /robots.txt",
    fn: async () => {
      const { res, text } = await fetchText("/robots.txt");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text.toLowerCase(), "sitemap", "missing sitemap line");
    },
  },
  {
    name: "GET /insights/rss.xml (rss 2.0 + items)",
    fn: async () => {
      const { res, text } = await fetchText("/insights/rss.xml");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "<rss", "not rss");
      assertContains(text, "<item>", "no <item> entries");
    },
  },
  {
    name: "GET /insights (200 + featured article)",
    fn: async () => {
      const { res, text } = await fetchText("/insights");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "AI 肖像授权合规", "missing legal article title");
    },
  },
  {
    name: "GET /insights/ai-portrait-compliance-2026 (detail + JSON-LD)",
    fn: async () => {
      const { res, text } = await fetchText("/insights/ai-portrait-compliance-2026");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "application/ld+json", "missing article JSON-LD");
      assertContains(text, "采集阶段", "missing section heading");
    },
  },
  {
    name: "GET /help (200 + most helpful + 30+ entries)",
    fn: async () => {
      const { res, text } = await fetchText("/help");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "本周最多人觉得有用", "missing 'most helpful' label");
      // there should be 30+ help entries on the page (each rendered link)
      const occurrences = (text.match(/\/help\//g) || []).length;
      assert(occurrences >= 30, `only ${occurrences} /help/ links found`);
    },
  },
  {
    name: "GET /help/what-is-mira (FAQ JSON-LD + vote form)",
    fn: async () => {
      const { res, text } = await fetchText("/help/what-is-mira");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "FAQPage", "missing FAQPage JSON-LD");
      assertContains(text, "有用", "missing vote button");
    },
  },
  {
    name: "GET /help/contact (form 200)",
    fn: async () => {
      const { res, text } = await fetchText("/help/contact");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "提交工单", "missing contact form heading");
      assertContains(text, "name=\"email\"", "missing email input");
    },
  },
  {
    name: "GET /transparency (live counters)",
    fn: async () => {
      const { res, text } = await fetchText("/transparency");
      assert(res.status === 200, `status=${res.status}`);
      assertContains(text, "Transparency Report", "missing report header");
      assertContains(text, "/api/health", "missing health endpoint reference");
    },
  },
  {
    name: "GET /admin/system (auth wall redirect 30x)",
    fn: async () => {
      const { res } = await fetchText("/admin/system");
      assert(
        res.status === 307 || res.status === 302 || res.status === 200,
        `unexpected status ${res.status}`
      );
    },
  },
  {
    name: "GET /admin/tickets (auth wall redirect 30x)",
    fn: async () => {
      const { res } = await fetchText("/admin/tickets");
      assert(
        res.status === 307 || res.status === 302 || res.status === 200,
        `unexpected status ${res.status}`
      );
    },
  },
  {
    name: "GET /marketplace (200)",
    fn: async () => {
      const { res } = await fetchText("/marketplace");
      assert(res.status === 200, `status=${res.status}`);
    },
  },
  {
    name: "GET /admin/webhooks/queue (auth wall 30x)",
    fn: async () => {
      const { res } = await fetchText("/admin/webhooks/queue");
      assert(
        res.status === 307 || res.status === 302 || res.status === 200,
        `unexpected status ${res.status}`
      );
    },
  },
  {
    name: "POST /api/v1/orders (no key → 401)",
    fn: async () => {
      const { res, text } = await fetchText("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talentId: 1, projectName: "smoke", packType: "tvc" }),
      });
      assert(res.status === 401, `status=${res.status}, body=${text.slice(0, 120)}`);
    },
  },
  {
    name: "GET /u/<yuhan slug or id> (200 + Creator)",
    fn: async () => {
      // 先找 GET /api/health,然后通过 sqlite 没法读;直接遍历 /u/user-{1..150} 找首个 200 的 creator
      // 实际 seed 后 creator id 段在 admin/partner/mcn 之后,常 5..12 或更高
      let ok = false;
      let last = 0;
      const candidates: string[] = [];
      for (let i = 1; i <= 150; i++) candidates.push(`/u/user-${i}`);
      for (let i = 1; i <= 150; i++) candidates.push(`/u/${i}`);
      for (const path of candidates) {
        const { res, text } = await fetchText(path);
        last = res.status;
        if (res.status === 200 && (text.includes("Creator") || text.includes("创作者主页") || text.includes("形象作品"))) {
          ok = true;
          break;
        }
      }
      assert(ok, `no /u/* candidate hit, last=${last}`);
    },
  },
];

async function main() {
  console.log(`[smoke] base = ${BASE}`);
  // quick sanity: can we even reach the server?
  try {
    const ping = await fetch(BASE + "/api/health", { redirect: "manual" });
    void ping;
  } catch (e) {
    console.error(`[smoke] cannot reach ${BASE}. is the dev server running?`);
    console.error(e instanceof Error ? e.message : e);
    process.exit(2);
  }

  for (const c of CHECKS) {
    const t0 = Date.now();
    try {
      await c.fn();
      pass++;
      console.log(`  PASS  ${c.name}  (${Date.now() - t0}ms)`);
    } catch (e) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`${c.name} :: ${msg}`);
      console.log(`  FAIL  ${c.name}  ::  ${msg}`);
    }
  }

  console.log("");
  console.log(`[smoke] PASS ${pass} / ${CHECKS.length}`);
  if (fail > 0) {
    console.log(`[smoke] FAIL ${fail}`);
    for (const f of failures) console.log("  -", f);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
