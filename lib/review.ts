import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Review } from "@/db/schema";

const REVIEW_WINDOW_SEC = 7 * 24 * 60 * 60;

export function canReview(
  orderId: number,
  fromUserId: number,
  role: "partner_to_creator" | "creator_to_partner"
): { ok: true } | { ok: false; reason: string } {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) return { ok: false, reason: "订单不存在" };
  if (o.status !== "settled") return { ok: false, reason: "订单尚未结算" };

  const settledRevenue = db
    .select()
    .from(schema.revenues)
    .where(and(eq(schema.revenues.orderId, orderId), eq(schema.revenues.kind, "share")))
    .get();
  const settledAt = settledRevenue?.createdAt ?? o.createdAt;
  const now = Math.floor(Date.now() / 1000);
  if (now - settledAt > REVIEW_WINDOW_SEC)
    return { ok: false, reason: "已超过 7 天评价窗口" };

  const existing = db
    .select()
    .from(schema.reviews)
    .where(
      and(
        eq(schema.reviews.orderId, orderId),
        eq(schema.reviews.fromUserId, fromUserId),
        eq(schema.reviews.role, role)
      )
    )
    .get();
  if (existing) return { ok: false, reason: "你已经评价过此订单" };

  return { ok: true };
}

export function getReviewsForOrder(orderId: number): Review[] {
  return db.select().from(schema.reviews).where(eq(schema.reviews.orderId, orderId)).all();
}

export function avgRatingFor(userId: number): { avg: number; count: number } {
  const list = db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.toUserId, userId))
    .all();
  if (list.length === 0) return { avg: 0, count: 0 };
  const sum = list.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((sum / list.length) * 10) / 10, count: list.length };
}

export function parseTags(tagsJson: string): string[] {
  try {
    const v = JSON.parse(tagsJson);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export const REVIEW_TAGS = {
  partner_to_creator: [
    "专业",
    "按时",
    "合规",
    "配合度高",
    "演技好",
    "形象贴合",
    "态度好",
    "效率快",
  ],
  creator_to_partner: [
    "结算及时",
    "尊重创作者",
    "需求清晰",
    "沟通顺畅",
    "无强迫修改",
    "守约",
  ],
};
