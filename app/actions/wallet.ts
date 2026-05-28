"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { credit, debit, getOrCreateWallet, yuanToFen } from "@/lib/wallet";
import { mintRecord } from "@/lib/chain";
import { notifyUser, notifyAdmins } from "@/lib/notify";
import { logAction } from "@/lib/audit";

export async function rechargeWallet(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/wallet/recharge");
  const yuan = Number(formData.get("amount") || 0);
  const channel = String(formData.get("channel") || "wechat") as "wechat" | "alipay" | "bank";
  if (!yuan || yuan < 1) redirect("/wallet/recharge?err=amount");
  const fen = yuanToFen(yuan);
  const r = credit(u.id, fen, "recharge", "wallet_recharge", null, `${channel} 充值 ¥${yuan}`);
  if (!r.ok) redirect("/wallet/recharge?err=fail");
  notifyUser(u.id, "wallet_credit", "wallets", null, "充值到账", `¥${yuan} 已入账`);
  logAction(u, "wallet_recharge", "wallets", null, null, { amount: fen, channel }, `钱包充值 ¥${yuan}`);
  redirect("/wallet?ok=recharge");
}

export async function submitWithdrawal(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/wallet/withdraw");
  const yuan = Number(formData.get("amount") || 0);
  const channel = String(formData.get("channel") || "bank") as "bank" | "wechat" | "alipay";
  if (!yuan || yuan < 10) redirect("/wallet/withdraw?err=min");
  const fen = yuanToFen(yuan);

  const accountName = String(formData.get("accountName") || "").trim();
  const accountNo = String(formData.get("accountNo") || "").trim();
  const bankName = String(formData.get("bankName") || "").trim();
  if (!accountName || !accountNo) redirect("/wallet/withdraw?err=fields");

  const accountInfo = JSON.stringify({
    channel,
    accountName,
    accountNo,
    bankName: channel === "bank" ? bankName : undefined,
  });

  // freeze (debit) immediately
  const d = debit(u.id, fen, "withdraw_out", "withdrawals", null, `提现申请 ¥${yuan} · ${channel}`);
  if (!d.ok) redirect("/wallet/withdraw?err=balance");

  const w = db
    .insert(schema.withdrawals)
    .values({
      userId: u.id,
      amount: fen,
      channel,
      accountInfo,
      status: "pending",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();

  notifyUser(u.id, "withdraw_submitted", "withdrawals", w.id, "提现已提交", `¥${yuan} 等待管理员审核`);
  notifyAdmins("withdraw_submitted", "withdrawals", w.id, "新提现申请", `用户 #${u.id} · ¥${yuan} · ${channel}`);
  logAction(u, "withdrawal_submitted", "withdrawals", w.id, null, w, `提现 ¥${yuan}`);
  redirect("/wallet?ok=withdraw");
}

export async function approveWithdrawal(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/withdrawals");
  const id = Number(formData.get("id"));
  const w = db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, id)).get();
  if (!w || w.status !== "pending") redirect("/admin/withdrawals");
  db.update(schema.withdrawals)
    .set({ status: "approved", reviewedBy: u.id })
    .where(eq(schema.withdrawals.id, id))
    .run();
  notifyUser(w.userId, "withdraw_approved", "withdrawals", id, "提现已批准", `¥${(w.amount / 100).toFixed(2)} · 等待打款`);
  logAction(u, "withdrawal_approved", "withdrawals", id, w, { ...w, status: "approved" }, `提现批准`);
  redirect("/admin/withdrawals");
}

export async function markWithdrawalPaid(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/withdrawals");
  const id = Number(formData.get("id"));
  const w = db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, id)).get();
  if (!w || w.status !== "approved") redirect("/admin/withdrawals");
  const now = Math.floor(Date.now() / 1000);
  const cr = mintRecord("withdrawals", id, {
    op: "paid",
    amount: w.amount,
    userId: w.userId,
    channel: w.channel,
    tradeNo: "WD" + now + crypto.randomBytes(3).toString("hex").toUpperCase(),
    at: now,
  });
  db.update(schema.withdrawals)
    .set({ status: "paid", paidAt: now, chainRecordId: cr.id })
    .where(eq(schema.withdrawals.id, id))
    .run();
  notifyUser(w.userId, "withdraw_paid", "withdrawals", id, "提现已打款", `¥${(w.amount / 100).toFixed(2)} 已到账`);
  logAction(u, "withdrawal_paid", "withdrawals", id, w, { ...w, status: "paid" }, `提现打款`);
  redirect("/admin/withdrawals");
}

export async function rejectWithdrawal(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/withdrawals");
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") || "").trim();
  const w = db.select().from(schema.withdrawals).where(eq(schema.withdrawals.id, id)).get();
  if (!w || w.status !== "pending") redirect("/admin/withdrawals");
  db.update(schema.withdrawals)
    .set({ status: "rejected", reviewedBy: u.id, reason: reason || "管理员驳回" })
    .where(eq(schema.withdrawals.id, id))
    .run();
  // refund the frozen amount
  credit(w.userId, w.amount, "refund_in", "withdrawals", id, `提现驳回退款`);
  notifyUser(w.userId, "withdraw_rejected", "withdrawals", id, "提现被拒", reason || "管理员驳回");
  logAction(u, "withdrawal_rejected", "withdrawals", id, w, { ...w, status: "rejected", reason }, `提现驳回`);
  redirect("/admin/withdrawals");
}

// Ensure wallet exists (called from /wallet page if needed)
export async function ensureWallet(): Promise<void> {
  const u = await getCurrentUser();
  if (u) getOrCreateWallet(u.id);
}
