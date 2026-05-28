import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { mintRecord } from "./chain";
import type { Wallet, WalletTxn } from "@/db/schema";

export type WalletTxnKind =
  | "recharge"
  | "order_pay"
  | "revenue_in"
  | "withdraw_out"
  | "refund_in"
  | "fee_out"
  | "adjust";

const now = () => Math.floor(Date.now() / 1000);

export function getOrCreateWallet(userId: number): Wallet {
  const existing = db
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.userId, userId))
    .get();
  if (existing) return existing;
  const r = db
    .insert(schema.wallets)
    .values({
      userId,
      balance: 0,
      lifetimeIn: 0,
      lifetimeOut: 0,
      updatedAt: now(),
    })
    .returning()
    .get();
  return r;
}

export function getWallet(userId: number): Wallet | null {
  const existing = db
    .select()
    .from(schema.wallets)
    .where(eq(schema.wallets.userId, userId))
    .get();
  return existing ?? null;
}

type CreditResult =
  | { ok: true; txn: WalletTxn; wallet: Wallet }
  | { ok: false; error: string };

export function credit(
  userId: number,
  amount: number,
  kind: WalletTxnKind,
  refTable: string | null,
  refId: number | null,
  note: string
): CreditResult {
  if (amount <= 0) return { ok: false, error: "amount must be positive" };
  const w = getOrCreateWallet(userId);
  const txn = db
    .insert(schema.walletTxns)
    .values({
      walletId: w.id,
      kind,
      amount,
      refTable,
      refId,
      note,
      createdAt: now(),
    })
    .returning()
    .get();
  // refId 指向这条流水本身,(refTable, refId) 才是有效的回查指针
  const cr = mintRecord("wallet_txns", txn.id, {
    userId,
    walletId: w.id,
    kind,
    amount,
    refTable,
    refId,
    note,
    at: now(),
  });
  db.update(schema.walletTxns)
    .set({ chainRecordId: cr.id })
    .where(eq(schema.walletTxns.id, txn.id))
    .run();
  const after = db
    .update(schema.wallets)
    .set({
      balance: w.balance + amount,
      lifetimeIn: w.lifetimeIn + amount,
      updatedAt: now(),
    })
    .where(eq(schema.wallets.id, w.id))
    .returning()
    .get();
  return { ok: true, txn: { ...txn, chainRecordId: cr.id }, wallet: after };
}

export function debit(
  userId: number,
  amount: number,
  kind: WalletTxnKind,
  refTable: string | null,
  refId: number | null,
  note: string
): CreditResult {
  if (amount <= 0) return { ok: false, error: "amount must be positive" };
  const w = getOrCreateWallet(userId);
  if (w.balance < amount) return { ok: false, error: "余额不足" };
  const txn = db
    .insert(schema.walletTxns)
    .values({
      walletId: w.id,
      kind,
      amount: -amount,
      refTable,
      refId,
      note,
      createdAt: now(),
    })
    .returning()
    .get();
  // refId 指向这条流水本身,(refTable, refId) 才是有效的回查指针
  const cr = mintRecord("wallet_txns", txn.id, {
    userId,
    walletId: w.id,
    kind,
    amount: -amount,
    refTable,
    refId,
    note,
    at: now(),
  });
  db.update(schema.walletTxns)
    .set({ chainRecordId: cr.id })
    .where(eq(schema.walletTxns.id, txn.id))
    .run();
  const after = db
    .update(schema.wallets)
    .set({
      balance: w.balance - amount,
      lifetimeOut: w.lifetimeOut + amount,
      updatedAt: now(),
    })
    .where(eq(schema.wallets.id, w.id))
    .returning()
    .get();
  return { ok: true, txn: { ...txn, chainRecordId: cr.id }, wallet: after };
}

const KIND_LABEL: Record<WalletTxnKind, string> = {
  recharge: "充值",
  order_pay: "订单支付",
  revenue_in: "分账入账",
  withdraw_out: "提现",
  refund_in: "退款",
  fee_out: "手续费",
  adjust: "调整",
};

export function txnKindLabel(kind: WalletTxnKind): string {
  return KIND_LABEL[kind] ?? kind;
}

export function fenToYuan(fen: number): string {
  const sign = fen < 0 ? "-" : "";
  const abs = Math.abs(fen);
  const yuan = Math.floor(abs / 100);
  const cents = abs % 100;
  return sign + "¥" + yuan.toLocaleString() + "." + String(cents).padStart(2, "0");
}

export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100);
}
