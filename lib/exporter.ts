import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function exportToCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const out: string[] = [];
  out.push(headers.map((h) => csvEscape(h.label)).join(","));
  for (const row of rows) {
    out.push(headers.map((h) => csvEscape(row[h.key])).join(","));
  }
  // UTF-8 BOM so Excel reads gracefully
  return "﻿" + out.join("\r\n");
}

export function exportToJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export function newPayloadKey(): string {
  return crypto.randomBytes(12).toString("hex");
}

export function createExportJob(userId: number, kind: "gdpr_all" | "orders_csv" | "revenues_csv" | "invoices_pdf" | "wallet_csv", sizeHint?: number) {
  const now = Math.floor(Date.now() / 1000);
  const key = newPayloadKey();
  const j = db
    .insert(schema.exportJobs)
    .values({
      userId,
      kind,
      status: "ready",
      payloadKey: key,
      size: sizeHint ?? null,
      requestedAt: now,
      completedAt: now,
    })
    .returning()
    .get();
  return j;
}

export function ordersCsvFor(userId: number, role: string): string {
  let rows: Record<string, unknown>[] = [];
  if (role === "partner") {
    const list = db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.partnerId, userId))
      .orderBy(desc(schema.orders.createdAt))
      .all();
    rows = list.map((o) => ({
      id: o.id,
      projectName: o.projectName,
      scope: o.scope,
      amount: o.amount,
      share: o.share,
      status: o.status,
      createdAt: new Date(o.createdAt * 1000).toISOString(),
    }));
  } else {
    // creator: orders for their talents
    const talents = db.select().from(schema.talents).where(eq(schema.talents.creatorId, userId)).all();
    const tIds = new Set(talents.map((t) => t.id));
    const all = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).all();
    rows = all
      .filter((o) => tIds.has(o.talentId))
      .map((o) => ({
        id: o.id,
        projectName: o.projectName,
        scope: o.scope,
        amount: o.amount,
        share: o.share,
        status: o.status,
        createdAt: new Date(o.createdAt * 1000).toISOString(),
      }));
  }
  return exportToCsv(rows, [
    { key: "id", label: "订单 ID" },
    { key: "projectName", label: "项目" },
    { key: "scope", label: "授权范围" },
    { key: "amount", label: "金额 (元)" },
    { key: "share", label: "分账 %" },
    { key: "status", label: "状态" },
    { key: "createdAt", label: "创建时间" },
  ]);
}

export function revenuesCsvFor(userId: number): string {
  const rows = db
    .select()
    .from(schema.revenues)
    .where(eq(schema.revenues.creatorId, userId))
    .orderBy(desc(schema.revenues.createdAt))
    .all();
  return exportToCsv(
    rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      kind: r.kind,
      amount: r.amount,
      note: r.note,
      createdAt: new Date(r.createdAt * 1000).toISOString(),
    })),
    [
      { key: "id", label: "ID" },
      { key: "orderId", label: "订单 ID" },
      { key: "kind", label: "类型" },
      { key: "amount", label: "金额 (元)" },
      { key: "note", label: "备注" },
      { key: "createdAt", label: "时间" },
    ]
  );
}

export function walletCsvFor(userId: number): string {
  const w = db.select().from(schema.wallets).where(eq(schema.wallets.userId, userId)).get();
  if (!w) return exportToCsv([], [{ key: "id", label: "无数据" }]);
  const rows = db
    .select()
    .from(schema.walletTxns)
    .where(eq(schema.walletTxns.walletId, w.id))
    .orderBy(desc(schema.walletTxns.createdAt))
    .all();
  return exportToCsv(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      amount: (r.amount / 100).toFixed(2),
      note: r.note,
      refTable: r.refTable ?? "",
      createdAt: new Date(r.createdAt * 1000).toISOString(),
    })),
    [
      { key: "id", label: "ID" },
      { key: "kind", label: "类型" },
      { key: "amount", label: "金额 (元)" },
      { key: "note", label: "备注" },
      { key: "refTable", label: "关联表" },
      { key: "createdAt", label: "时间" },
    ]
  );
}

export function gdprDumpFor(userId: number): string {
  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  const verifications = db.select().from(schema.verifications).where(eq(schema.verifications.userId, userId)).all();
  const orders =
    user?.role === "partner"
      ? db.select().from(schema.orders).where(eq(schema.orders.partnerId, userId)).all()
      : [];
  const talents = db.select().from(schema.talents).where(eq(schema.talents.creatorId, userId)).all();
  const revenues = db.select().from(schema.revenues).where(eq(schema.revenues.creatorId, userId)).all();
  const wallet = db.select().from(schema.wallets).where(eq(schema.wallets.userId, userId)).get();
  const walletTxns = wallet
    ? db.select().from(schema.walletTxns).where(eq(schema.walletTxns.walletId, wallet.id)).all()
    : [];
  const notifications = db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .all();
  return exportToJson({
    exportedAt: new Date().toISOString(),
    user,
    verifications,
    talents,
    orders,
    revenues,
    wallet,
    walletTxns,
    notifications,
  });
}
