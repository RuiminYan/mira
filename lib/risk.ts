import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { notifyAdmins } from "./notify";

const now = () => Math.floor(Date.now() / 1000);

export type RiskKind =
  | "multi_account"
  | "rapid_order"
  | "high_amount"
  | "rejected_kyc"
  | "suspicious_ip";

export type Severity = "low" | "med" | "high";

function writeFlag(
  userId: number,
  orderId: number | null,
  kind: RiskKind,
  severity: Severity,
  detail: unknown
): void {
  db.insert(schema.riskFlags)
    .values({
      userId,
      orderId: orderId ?? null,
      kind,
      severity,
      detail: JSON.stringify(detail ?? {}),
      status: "open",
      createdAt: now(),
    })
    .run();
  notifyAdmins(
    "risk_flagged",
    "risk_flags",
    null,
    "新风控告警",
    `用户 #${userId} · ${kind} · ${severity}`
  );
}

export function checkMultiAccount(userId: number, idCardHash: string): void {
  const list = db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.idCardHashSHA256, idCardHash))
    .all();
  const distinct = new Set(list.map((v) => v.userId));
  if (distinct.size > 1) {
    writeFlag(userId, null, "multi_account", "high", {
      idCardHash,
      bindingUsers: Array.from(distinct),
    });
  }
}

export function checkRapidOrders(
  partnerId: number,
  minutes: number = 5,
  threshold: number = 5
): void {
  const cutoff = now() - minutes * 60;
  const recent = db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.partnerId, partnerId),
        gte(schema.orders.createdAt, cutoff)
      )
    )
    .all();
  if (recent.length >= threshold) {
    writeFlag(partnerId, null, "rapid_order", "med", {
      windowMin: minutes,
      count: recent.length,
    });
  }
}

export function checkHighAmount(
  userId: number,
  orderId: number,
  orderAmount: number,
  threshold: number = 10000
): void {
  if (orderAmount >= threshold) {
    writeFlag(userId, orderId, "high_amount", "high", {
      amount: orderAmount,
      threshold,
    });
  }
}

export function isBanned(userId: number): boolean {
  const u = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  return !!u?.banned;
}

export function severityLabel(s: string): string {
  if (s === "high") return "高危";
  if (s === "med") return "中等";
  return "低";
}

export function riskKindLabel(k: string): string {
  if (k === "multi_account") return "多账号";
  if (k === "rapid_order") return "短时高频下单";
  if (k === "high_amount") return "大额订单";
  if (k === "rejected_kyc") return "实名被拒";
  if (k === "suspicious_ip") return "可疑 IP";
  return k;
}
