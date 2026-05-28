import { and, eq, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { retryDelivery } from "@/lib/webhooks";

export type QueueTickResult = {
  picked: number;
  retried: number;
  pending: number;
  ok: number;
  fail: number;
};

export async function processWebhookQueue(limit = 50): Promise<QueueTickResult> {
  const now = Math.floor(Date.now() / 1000);

  const due = db
    .select()
    .from(schema.webhookDeliveries)
    .where(
      and(
        eq(schema.webhookDeliveries.status, "pending"),
        lte(schema.webhookDeliveries.nextRetryAt, now)
      )
    )
    .limit(limit)
    .all();

  let retried = 0;
  for (const d of due) {
    if (d.nextRetryAt == null) continue;
    await retryDelivery(d);
    retried++;
  }

  const counts = countDeliveryStatuses();
  return {
    picked: due.length,
    retried,
    pending: counts.pending,
    ok: counts.ok,
    fail: counts.fail,
  };
}

export function countDeliveryStatuses(): { pending: number; ok: number; fail: number } {
  const rows = db
    .select({
      status: schema.webhookDeliveries.status,
      c: sql<number>`count(*)`,
    })
    .from(schema.webhookDeliveries)
    .groupBy(schema.webhookDeliveries.status)
    .all();
  let pending = 0;
  let ok = 0;
  let fail = 0;
  for (const r of rows) {
    const c = Number(r.c) || 0;
    if (r.status === "pending") pending = c;
    else if (r.status === "ok") ok = c;
    else if (r.status === "fail") fail = c;
  }
  return { pending, ok, fail };
}

export function recentDeliveries(limit = 30) {
  return db
    .select({
      d: schema.webhookDeliveries,
      hookUrl: schema.webhooks.url,
      hookUserId: schema.webhooks.userId,
    })
    .from(schema.webhookDeliveries)
    .leftJoin(schema.webhooks, eq(schema.webhooks.id, schema.webhookDeliveries.webhookId))
    .orderBy(sql`${schema.webhookDeliveries.createdAt} desc`)
    .limit(limit)
    .all();
}
