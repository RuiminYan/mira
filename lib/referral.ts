import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { notifyUser } from "./notify";
import { triggerOn } from "@/lib/achievements";

const now = () => Math.floor(Date.now() / 1000);

export function inviteCodeFor(userId: number): string {
  const hash = crypto.createHash("sha256").update("mira-ref-" + userId).digest("hex");
  return "MIRA-" + hash.slice(0, 6).toUpperCase();
}

export function userIdFromInviteCode(code: string): number | null {
  const upper = code.trim().toUpperCase();
  if (!/^MIRA-[0-9A-F]{6}$/.test(upper)) return null;
  const users = db.select().from(schema.users).all();
  for (const u of users) {
    if (inviteCodeFor(u.id) === upper) return u.id;
  }
  return null;
}

export function bindReferral(inviteeId: number, inviteCode: string): void {
  const referrerId = userIdFromInviteCode(inviteCode);
  if (!referrerId || referrerId === inviteeId) return;
  const existing = db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.inviteeId, inviteeId))
    .get();
  if (existing) return;
  db.insert(schema.referrals)
    .values({
      referrerId,
      inviteCode: inviteCode.trim().toUpperCase(),
      inviteeEmail: null,
      inviteeId,
      rewardCredits: 100,
      status: "pending",
      createdAt: now(),
    })
    .run();
}

export function maybeFireReferralReward(inviteeId: number, orderId: number): void {
  const ref = db
    .select()
    .from(schema.referrals)
    .where(and(eq(schema.referrals.inviteeId, inviteeId), eq(schema.referrals.status, "pending")))
    .get();
  if (!ref) return;
  // ensure first order for invitee
  const orders = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.partnerId, inviteeId))
    .all();
  const firstSettled = orders.find((o) => o.status === "settled" || o.status === "paid");
  if (!firstSettled) return;

  // grant credits
  const credits = db
    .select()
    .from(schema.studioCredits)
    .where(eq(schema.studioCredits.userId, ref.referrerId))
    .get();
  if (credits) {
    db.update(schema.studioCredits)
      .set({
        balance: credits.balance + ref.rewardCredits,
        lifetimeRecharged: credits.lifetimeRecharged + ref.rewardCredits,
        updatedAt: now(),
      })
      .where(eq(schema.studioCredits.userId, ref.referrerId))
      .run();
  } else {
    db.insert(schema.studioCredits)
      .values({
        userId: ref.referrerId,
        balance: ref.rewardCredits,
        lifetimeRecharged: ref.rewardCredits,
        lifetimeUsed: 0,
        updatedAt: now(),
      })
      .run();
  }
  db.update(schema.referrals)
    .set({ status: "redeemed", redeemedAt: now() })
    .where(eq(schema.referrals.id, ref.id))
    .run();
  notifyUser(
    ref.referrerId,
    "referral_reward",
    "referrals",
    ref.id,
    "邀请奖励到账",
    `已为你发放 ${ref.rewardCredits} credits`
  );
  triggerOn("referral_redeemed", ref.referrerId, { inviteeId, refId: ref.id });
  void orderId;
}
