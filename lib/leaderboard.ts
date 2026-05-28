import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type LbKind = "creator_revenue" | "partner_spend" | "talent_orders";

export const LB_LABEL: Record<LbKind, string> = {
  creator_revenue: "创作者收益榜",
  partner_spend: "制作方投入榜",
  talent_orders: "形象热度榜",
};

function periodRange(period: string): { from: number; to: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return { from: 0, to: Math.floor(Date.now() / 1000) };
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const from = Math.floor(new Date(Date.UTC(y, mm - 1, 1)).getTime() / 1000);
  const to = Math.floor(new Date(Date.UTC(y, mm, 1)).getTime() / 1000) - 1;
  return { from, to };
}

export function currentPeriod(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function listPeriods(months = 6): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < months; i++) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

export function computeLeaderboard(period: string): void {
  const { from, to } = periodRange(period);

  // Clear previous for that period
  db.delete(schema.leaderboards).where(eq(schema.leaderboards.period, period)).run();
  const now = Math.floor(Date.now() / 1000);

  // creator_revenue: sum of revenues per creator
  const creatorRows = db
    .select({
      userId: schema.revenues.creatorId,
      value: sql<number>`coalesce(sum(${schema.revenues.amount}),0)`,
    })
    .from(schema.revenues)
    .where(and(gte(schema.revenues.createdAt, from), lte(schema.revenues.createdAt, to)))
    .groupBy(schema.revenues.creatorId)
    .orderBy(desc(sql`coalesce(sum(${schema.revenues.amount}),0)`))
    .limit(10)
    .all();
  creatorRows.forEach((r, idx) => {
    db.insert(schema.leaderboards)
      .values({
        period,
        kind: "creator_revenue",
        userId: r.userId,
        talentId: null,
        rank: idx + 1,
        value: r.value,
        createdAt: now,
      })
      .run();
  });

  // partner_spend: sum of orders per partner
  const partnerRows = db
    .select({
      userId: schema.orders.partnerId,
      value: sql<number>`coalesce(sum(${schema.orders.amount}),0)`,
    })
    .from(schema.orders)
    .where(and(gte(schema.orders.createdAt, from), lte(schema.orders.createdAt, to)))
    .groupBy(schema.orders.partnerId)
    .orderBy(desc(sql`coalesce(sum(${schema.orders.amount}),0)`))
    .limit(10)
    .all();
  partnerRows.forEach((r, idx) => {
    db.insert(schema.leaderboards)
      .values({
        period,
        kind: "partner_spend",
        userId: r.userId,
        talentId: null,
        rank: idx + 1,
        value: r.value,
        createdAt: now,
      })
      .run();
  });

  // talent_orders: count orders per talent
  const talentRows = db
    .select({
      talentId: schema.orders.talentId,
      value: sql<number>`count(*)`,
    })
    .from(schema.orders)
    .where(and(gte(schema.orders.createdAt, from), lte(schema.orders.createdAt, to)))
    .groupBy(schema.orders.talentId)
    .orderBy(desc(sql`count(*)`))
    .limit(10)
    .all();
  talentRows.forEach((r, idx) => {
    db.insert(schema.leaderboards)
      .values({
        period,
        kind: "talent_orders",
        userId: null,
        talentId: r.talentId,
        rank: idx + 1,
        value: r.value,
        createdAt: now,
      })
      .run();
  });
}

export function fetchBoard(period: string, kind: LbKind) {
  return db
    .select()
    .from(schema.leaderboards)
    .where(and(eq(schema.leaderboards.period, period), eq(schema.leaderboards.kind, kind)))
    .orderBy(schema.leaderboards.rank)
    .all();
}
