import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { notifyUser } from "@/lib/notify";

export const BADGE_DEFS: {
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  tone: "brand" | "pink" | "cyan" | "amber";
  criteria: string;
}[] = [
  { code: "verified", name: "已实名", description: "完成实名认证并签订基础授权", icon: "ShieldCheck", rarity: "common", tone: "cyan", criteria: "完成 KYC" },
  { code: "first_order", name: "首单达成", description: "完成第一笔订单", icon: "Sparkles", rarity: "common", tone: "brand", criteria: "至少 1 笔订单" },
  { code: "top_creator", name: "Top 创作者", description: "进入月度创作者收益榜单 Top 10", icon: "Crown", rarity: "epic", tone: "amber", criteria: "进入月榜 Top 10" },
  { code: "rising_star", name: "新星", description: "30 天内涨粉迅速且首次结算", icon: "Flame", rarity: "rare", tone: "pink", criteria: "新人结算" },
  { code: "million_revenue", name: "百万累计", description: "累计授权与分账金额突破 100 万", icon: "DollarSign", rarity: "legendary", tone: "amber", criteria: "累计收入 ≥ 100 万" },
  { code: "platinum_partner", name: "白金制作方", description: "累计花费突破 50 万", icon: "Gem", rarity: "epic", tone: "cyan", criteria: "累计花费 ≥ 50 万" },
  { code: "compliance_hero", name: "合规先锋", description: "实名 + 内容审核零驳回", icon: "Award", rarity: "rare", tone: "brand", criteria: "零驳回记录" },
  { code: "mcn_certified", name: "MCN 认证", description: "由认证 MCN 签约管理", icon: "Building2", rarity: "rare", tone: "pink", criteria: "MCN 签约状态 active" },
];

export function ensureBadgeRows(): void {
  for (const def of BADGE_DEFS) {
    const existing = db.select().from(schema.badges).where(eq(schema.badges.code, def.code)).get();
    if (!existing) {
      db.insert(schema.badges).values(def).run();
    }
  }
}

export function grantBadge(userId: number, code: string): boolean {
  const b = db.select().from(schema.badges).where(eq(schema.badges.code, code)).get();
  if (!b) return false;
  const dup = db
    .select()
    .from(schema.userBadges)
    .where(and(eq(schema.userBadges.userId, userId), eq(schema.userBadges.badgeId, b.id)))
    .get();
  if (dup) return false;
  db.insert(schema.userBadges)
    .values({
      userId,
      badgeId: b.id,
      earnedAt: Math.floor(Date.now() / 1000),
      pinned: false,
    })
    .run();
  notifyUser(userId, "system", "badges", b.id, `获得徽章「${b.name}」`, b.description);
  return true;
}

export function togglePin(userBadgeId: number, userId: number): void {
  const row = db.select().from(schema.userBadges).where(eq(schema.userBadges.id, userBadgeId)).get();
  if (!row || row.userId !== userId) return;
  if (!row.pinned) {
    const pinned = db
      .select({ c: sql<number>`count(*)` })
      .from(schema.userBadges)
      .where(and(eq(schema.userBadges.userId, userId), eq(schema.userBadges.pinned, true)))
      .get();
    if ((pinned?.c ?? 0) >= 3) return;
  }
  db.update(schema.userBadges)
    .set({ pinned: !row.pinned })
    .where(eq(schema.userBadges.id, userBadgeId))
    .run();
}

export function maybeAutoGrant(userId: number): void {
  const u = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!u) return;

  if (u.verified) grantBadge(userId, "verified");

  if (u.role === "creator") {
    const settledRev = db
      .select({ c: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(${schema.revenues.amount}),0)` })
      .from(schema.revenues)
      .where(eq(schema.revenues.creatorId, userId))
      .get();
    if ((settledRev?.c ?? 0) > 0) grantBadge(userId, "first_order");
    if ((settledRev?.sum ?? 0) >= 1000000) grantBadge(userId, "million_revenue");

    // mcn_certified
    const mcn = db
      .select()
      .from(schema.mcnCreators)
      .where(and(eq(schema.mcnCreators.creatorId, userId), eq(schema.mcnCreators.status, "active")))
      .get();
    if (mcn) grantBadge(userId, "mcn_certified");
  }

  if (u.role === "partner") {
    const spent = db
      .select({ c: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(${schema.orders.amount}),0)` })
      .from(schema.orders)
      .where(eq(schema.orders.partnerId, userId))
      .get();
    if ((spent?.c ?? 0) > 0) grantBadge(userId, "first_order");
    if ((spent?.sum ?? 0) >= 500000) grantBadge(userId, "platinum_partner");
  }

  // compliance_hero: no rejected verifications, no banned, no risk banned
  const rejectedV = db
    .select()
    .from(schema.verifications)
    .where(and(eq(schema.verifications.userId, userId), eq(schema.verifications.status, "rejected")))
    .get();
  const bannedRisk = db
    .select()
    .from(schema.riskFlags)
    .where(and(eq(schema.riskFlags.userId, userId), eq(schema.riskFlags.status, "banned")))
    .get();
  if (!rejectedV && !bannedRisk && !u.banned && u.verified) grantBadge(userId, "compliance_hero");
}

export function rarityTone(rarity: string): string {
  switch (rarity) {
    case "legendary": return "from-amber-400/40 to-pink-500/30 border-amber-300/40 text-amber-200";
    case "epic": return "from-fuchsia-500/30 to-violet-500/30 border-fuchsia-300/40 text-fuchsia-200";
    case "rare": return "from-cyan-500/30 to-violet-500/30 border-cyan-300/40 text-cyan-200";
    default: return "from-white/[0.06] to-white/[0.02] border-line text-ink-2";
  }
}

export function getPinnedBadges(userId: number) {
  return db
    .select({ ub: schema.userBadges, b: schema.badges })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.userBadges.badgeId))
    .where(and(eq(schema.userBadges.userId, userId), eq(schema.userBadges.pinned, true)))
    .all();
}
