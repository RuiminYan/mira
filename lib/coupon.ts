import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Coupon } from "@/db/schema";

const now = () => Math.floor(Date.now() / 1000);

export type ApplyResult =
  | {
      ok: true;
      coupon: Coupon;
      discountAmount: number;
      finalAmount: number;
    }
  | { ok: false; error: string };

export function evaluateCoupon(
  code: string,
  amountFen: number,
  scopeKind: "talent" | "bundle" | null,
  scopeRefId: number | null
): ApplyResult {
  const c = db
    .select()
    .from(schema.coupons)
    .where(eq(schema.coupons.code, code.trim().toUpperCase()))
    .get();
  if (!c) return { ok: false, error: "优惠码无效" };
  if (c.status !== "live") return { ok: false, error: "优惠码已失效" };
  if (c.startsAt > now()) return { ok: false, error: "优惠码未生效" };
  if (c.endsAt && c.endsAt < now()) return { ok: false, error: "优惠码已过期" };
  if (c.quota > 0 && c.used >= c.quota) return { ok: false, error: "优惠码已用完" };
  if (c.minSpend > 0 && amountFen < c.minSpend)
    return { ok: false, error: `订单金额需 ≥ ¥${(c.minSpend / 100).toFixed(2)}` };
  if (c.scope !== "global") {
    if (c.scope !== scopeKind) return { ok: false, error: "优惠码不适用于此商品" };
    if (c.scopeRefId !== scopeRefId)
      return { ok: false, error: "优惠码不适用于此商品" };
  }

  let discount = 0;
  if (c.kind === "discount_pct") {
    discount = Math.floor((amountFen * c.value) / 100);
  } else if (c.kind === "discount_fix") {
    discount = Math.min(amountFen, c.value);
  } else if (c.kind === "credits") {
    discount = 0;
  }
  return {
    ok: true,
    coupon: c,
    discountAmount: discount,
    finalAmount: Math.max(0, amountFen - discount),
  };
}

export function redeemCoupon(
  couponId: number,
  userId: number,
  orderId: number | null,
  discountAmount: number
): void {
  db.insert(schema.couponRedemptions)
    .values({
      couponId,
      userId,
      orderId: orderId ?? null,
      discountAmount,
      redeemedAt: now(),
    })
    .run();
  const c = db.select().from(schema.coupons).where(eq(schema.coupons.id, couponId)).get();
  if (c) {
    db.update(schema.coupons)
      .set({ used: c.used + 1 })
      .where(eq(schema.coupons.id, couponId))
      .run();
  }
  void and;
}

export function couponKindLabel(k: string): string {
  if (k === "discount_pct") return "百分比折扣";
  if (k === "discount_fix") return "立减";
  if (k === "credits") return "赠 credits";
  return k;
}
