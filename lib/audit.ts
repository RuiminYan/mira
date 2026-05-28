import { db, schema } from "@/db";
import type { User } from "@/db/schema";

export type AuditAction =
  | "verification_approved"
  | "verification_rejected"
  | "talent_approved"
  | "order_paid"
  | "order_status_updated"
  | "order_settled"
  | "takedown_approved"
  | "takedown_rejected"
  | "dispute_resolved"
  | "invoice_issued"
  | "distribution_pushed"
  | "distribution_published"
  | "mcn_invite_sent"
  | "mcn_invite_accepted"
  | "mcn_invite_rejected"
  | "mcn_creator_paused"
  | "mcn_creator_resumed"
  | "wallet_recharge"
  | "withdrawal_submitted"
  | "withdrawal_approved"
  | "withdrawal_paid"
  | "withdrawal_rejected"
  | "coupon_created"
  | "coupon_archived"
  | "review_submitted"
  | "risk_resolved"
  | "user_unbanned"
  | "org_created"
  | "csm_assigned";

function stringifyOrNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

export function logAction(
  actor: User | { id: number; role: string } | null,
  action: AuditAction,
  refTable: string | null,
  refId: number | null,
  before: unknown,
  after: unknown,
  note: string = ""
): void {
  db.insert(schema.auditLogs)
    .values({
      actorId: actor?.id ?? null,
      actorRole: actor?.role ?? "",
      action,
      refTable,
      refId,
      before: stringifyOrNull(before),
      after: stringifyOrNull(after),
      note,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
}

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  verification_approved: "实名通过",
  verification_rejected: "实名驳回",
  talent_approved: "形象上线",
  order_paid: "订单支付",
  order_status_updated: "订单状态变更",
  order_settled: "订单结算",
  takedown_approved: "下架通过",
  takedown_rejected: "下架驳回",
  dispute_resolved: "争议仲裁",
  invoice_issued: "发票开具",
  distribution_pushed: "分发推送",
  distribution_published: "分发上线",
  mcn_invite_sent: "MCN 邀请",
  mcn_invite_accepted: "MCN 邀请接受",
  mcn_invite_rejected: "MCN 邀请拒绝",
  mcn_creator_paused: "MCN 创作者暂停",
  mcn_creator_resumed: "MCN 创作者恢复",
  wallet_recharge: "钱包充值",
  withdrawal_submitted: "提现申请",
  withdrawal_approved: "提现批准",
  withdrawal_paid: "提现打款",
  withdrawal_rejected: "提现驳回",
  coupon_created: "创建优惠券",
  coupon_archived: "归档优惠券",
  review_submitted: "提交评价",
  risk_resolved: "风控处理",
  user_unbanned: "解封用户",
  org_created: "创建团队",
  csm_assigned: "分配 CSM",
};
