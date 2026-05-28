import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

type NotifyKind =
  | "verification_approved"
  | "verification_rejected"
  | "talent_approved"
  | "order_pending"
  | "order_paid"
  | "order_approved"
  | "order_delivered"
  | "order_settled"
  | "order_refunded"
  | "dispute_opened"
  | "dispute_resolved"
  | "invoice_requested"
  | "invoice_issued"
  | "takedown_requested"
  | "takedown_decision"
  | "new_message"
  | "quote_offer"
  | "quote_accepted"
  | "quote_rejected"
  | "mcn_invite"
  | "mcn_invite_response"
  | "distribution_live"
  | "wallet_credit"
  | "wallet_debit"
  | "withdraw_submitted"
  | "withdraw_approved"
  | "withdraw_rejected"
  | "withdraw_paid"
  | "coupon_redeemed"
  | "referral_reward"
  | "review_received"
  | "favorite_added"
  | "risk_flagged"
  | "org_invite"
  | "csm_assigned"
  | "system";

export function notifyUser(
  userId: number,
  kind: NotifyKind,
  refTable: string | null,
  refId: number | null,
  title: string,
  body: string
): void {
  db.insert(schema.notifications)
    .values({
      userId,
      kind,
      refTable,
      refId,
      title,
      body,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
}

export function notifyAdmins(
  kind: NotifyKind,
  refTable: string | null,
  refId: number | null,
  title: string,
  body: string
): void {
  const admins = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "admin"))
    .all();
  for (const a of admins) notifyUser(a.id, kind, refTable, refId, title, body);
}

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  approved: "已批准",
  delivered: "已交付",
  settled: "已结算",
  disputed: "争议中",
  refunded: "已退款",
  cancelled: "已取消",
};

export function ensureThread(
  kind: "order" | "quote" | "dm" | "system",
  refTable: string,
  refId: number,
  title: string,
  participants: { userId: number; role: "creator" | "partner" | "admin" | "system" }[]
): number {
  const existing = db
    .select()
    .from(schema.threads)
    .where(and(eq(schema.threads.refTable, refTable), eq(schema.threads.refId, refId)))
    .get();
  const now = Math.floor(Date.now() / 1000);
  if (existing) return existing.id;
  const t = db
    .insert(schema.threads)
    .values({
      kind,
      refTable,
      refId,
      title,
      lastMessageAt: now,
      createdAt: now,
    })
    .returning()
    .get();
  for (const p of participants) {
    db.insert(schema.threadParticipants)
      .values({
        threadId: t.id,
        userId: p.userId,
        unread: 0,
        role: p.role,
        joinedAt: now,
      })
      .run();
  }
  return t.id;
}

export function notifyOrderState(orderId: number, newStatus: string): void {
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) return;
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  if (!t) return;
  const label = STATUS_LABEL_MAP[newStatus] ?? newStatus;
  const kind: NotifyKind =
    newStatus === "paid"
      ? "order_paid"
      : newStatus === "approved"
        ? "order_approved"
        : newStatus === "delivered"
          ? "order_delivered"
          : newStatus === "settled"
            ? "order_settled"
            : newStatus === "refunded"
              ? "order_refunded"
              : newStatus === "pending"
                ? "order_pending"
                : "system";
  const title = `订单 ${label}`;
  const body = `${o.projectName} · ¥${o.amount.toLocaleString()}`;
  notifyUser(o.partnerId, kind, "orders", o.id, title, body);
  notifyUser(t.creatorId, kind, "orders", o.id, title, body);
}
