import crypto from "node:crypto";
import { like, or, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Talent } from "@/db/schema";

export type SearchScope = "talents" | "orders" | "users" | "notifications" | "docs";

export type GlobalSearchResult = {
  talents: { id: number; name: string; sub: string; href: string }[];
  orders: { id: number; name: string; sub: string; href: string }[];
  users: { id: number; name: string; sub: string; href: string }[];
  notifications: { id: number; name: string; sub: string; href: string }[];
  docs: { id: number; name: string; sub: string; href: string }[];
};

const STATIC_DOCS = [
  { id: 1, name: "开发者文档", sub: "API · Webhook 接入指南", href: "/developers" },
  { id: 2, name: "定价方案", sub: "Starter / Growth / Enterprise", href: "/pricing" },
  { id: 3, name: "排行榜", sub: "月度收益 / 投入 / 形象热度", href: "/leaderboard" },
  { id: 4, name: "帮助中心", sub: "常见问题与新人指引", href: "/help" },
  { id: 5, name: "用户协议", sub: "Terms of Service", href: "/terms" },
  { id: 6, name: "隐私政策", sub: "Privacy", href: "/privacy" },
];

export function globalSearch(q: string, scopes?: SearchScope[]): GlobalSearchResult {
  const query = q.trim();
  const out: GlobalSearchResult = { talents: [], orders: [], users: [], notifications: [], docs: [] };
  if (!query) return out;
  const wants = (s: SearchScope) => !scopes || scopes.length === 0 || scopes.includes(s);
  const pat = `%${query.replace(/[%_]/g, "")}%`;

  if (wants("talents")) {
    const rows = db
      .select()
      .from(schema.talents)
      .where(
        or(
          like(schema.talents.stageName, pat),
          like(schema.talents.styleTags, pat),
          like(schema.talents.bio, pat)
        )
      )
      .limit(5)
      .all();
    out.talents = rows.map((t) => ({
      id: t.id,
      name: t.stageName,
      sub: `${t.grade} · ${t.styleTags}`,
      href: `/marketplace/${t.id}`,
    }));
  }

  if (wants("orders")) {
    const rows = db
      .select()
      .from(schema.orders)
      .where(or(like(schema.orders.projectName, pat), like(schema.orders.scope, pat)))
      .orderBy(desc(schema.orders.createdAt))
      .limit(5)
      .all();
    out.orders = rows.map((o) => ({
      id: o.id,
      name: o.projectName,
      sub: `${o.scope} · ¥${o.amount.toLocaleString()}`,
      href: `/partner/orders/${o.id}`,
    }));
  }

  if (wants("users")) {
    const rows = db
      .select()
      .from(schema.users)
      .where(or(like(schema.users.nickname, pat), like(schema.users.email, pat)))
      .limit(5)
      .all();
    out.users = rows.map((u) => ({
      id: u.id,
      name: u.nickname,
      sub: u.role === "creator" ? "创作者" : u.role === "partner" ? "制作方" : u.role === "mcn" ? "MCN" : "管理员",
      href: u.role === "creator" ? `/u/${u.id}` : u.role === "partner" ? `/p/${u.id}` : "#",
    }));
  }

  if (wants("notifications")) {
    const rows = db
      .select()
      .from(schema.notifications)
      .where(or(like(schema.notifications.title, pat), like(schema.notifications.body, pat)))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(5)
      .all();
    out.notifications = rows.map((n) => ({
      id: n.id,
      name: n.title,
      sub: n.body || n.kind,
      href: "/notifications",
    }));
  }

  if (wants("docs")) {
    const ql = query.toLowerCase();
    out.docs = STATIC_DOCS.filter(
      (d) => d.name.toLowerCase().includes(ql) || d.sub.toLowerCase().includes(ql)
    ).slice(0, 5);
  }

  // Plans / badges optional lookup folded into docs
  if (wants("docs")) {
    const plans = db
      .select()
      .from(schema.plans)
      .where(or(like(schema.plans.name, pat), like(schema.plans.code, pat)))
      .limit(3)
      .all();
    for (const p of plans) {
      out.docs.push({ id: 1000 + p.id, name: `${p.name} 套餐`, sub: `¥${(p.priceMonth / 100).toFixed(0)} / 月`, href: "/pricing" });
    }
    const bs = db.select().from(schema.badges).where(like(schema.badges.name, pat)).limit(3).all();
    for (const b of bs) {
      out.docs.push({ id: 2000 + b.id, name: `徽章 · ${b.name}`, sub: b.description, href: `/me/badges` });
    }
  }

  void eq;
  return out;
}


export function tokenizeTags(s: string): string[] {
  return s
    .split(/[,，、\s/|]+/g)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export function cosineByTags(
  targetTags: string[],
  allTalents: Talent[]
): { talent: Talent; score: number }[] {
  const target = new Set(
    targetTags.flatMap((t) => tokenizeTags(t)).filter(Boolean)
  );
  if (target.size === 0) {
    return allTalents.map((t) => ({ talent: t, score: 0 }));
  }
  const out: { talent: Talent; score: number }[] = [];
  for (const t of allTalents) {
    const tags = new Set(tokenizeTags(t.styleTags));
    if (tags.size === 0) {
      out.push({ talent: t, score: 0 });
      continue;
    }
    let common = 0;
    for (const x of target) if (tags.has(x)) common++;
    const score = common / Math.sqrt(target.size * tags.size);
    out.push({ talent: t, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function findSimilarFaces(
  referenceUrl: string,
  allTalents: Talent[]
): { talent: Talent; score: number }[] {
  const seed = crypto.createHash("sha1").update(referenceUrl).digest();
  const out: { talent: Talent; score: number }[] = [];
  for (let i = 0; i < allTalents.length; i++) {
    const t = allTalents[i]!;
    // mix seed bytes with talent.id for stable but distinct score
    const idx = (t.id * 7 + i * 13) % seed.length;
    const b1 = seed[idx]!;
    const b2 = seed[(idx + 5) % seed.length]!;
    const mix = (b1 * 256 + b2) / 65535; // 0..1
    const score = 0.4 + mix * 0.55; // 0.4 .. 0.95
    out.push({ talent: t, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function relatedByTags(
  source: Talent,
  pool: Talent[],
  n = 4
): { talent: Talent; score: number }[] {
  const tags = tokenizeTags(source.styleTags);
  return cosineByTags(tags, pool.filter((p) => p.id !== source.id))
    .filter((x) => x.score > 0)
    .slice(0, n);
}
