import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Webhook, WebhookDelivery } from "@/db/schema";

export type WebhookEvent =
  | "order.paid"
  | "order.settled"
  | "order.refunded"
  | "talent.approved"
  | "review.created"
  | "verification.approved";

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  "order.paid",
  "order.settled",
  "order.refunded",
  "talent.approved",
  "review.created",
  "verification.approved",
];

export const EVENT_LABEL: Record<WebhookEvent, string> = {
  "order.paid": "订单已支付",
  "order.settled": "订单已结算",
  "order.refunded": "订单已退款",
  "talent.approved": "形象已上线",
  "review.created": "新增评价",
  "verification.approved": "实名通过",
};

// 指数退避(秒):attempt 1→60, 2→300, 3→900, 4→3600, 5→14400
const BACKOFF_SECONDS = [60, 300, 900, 3600, 14400];
const MAX_ATTEMPTS = 5;

export function nextBackoffSeconds(attempt: number): number {
  const idx = Math.max(0, Math.min(BACKOFF_SECONDS.length - 1, attempt - 1));
  return BACKOFF_SECONDS[idx]!;
}

export function hmacSha256Hex(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function parseEvents(s: string): string[] {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function generateSecret(): string {
  return crypto.randomBytes(8).toString("hex");
}

export type DispatchResult = {
  status: "ok" | "fail";
  httpCode: number | null;
  snippet: string | null;
};

export async function postWebhook(
  hook: Webhook,
  event: string,
  payload: unknown
): Promise<DispatchResult> {
  const body = JSON.stringify({ event, data: payload, at: Math.floor(Date.now() / 1000) });
  const sig = hmacSha256Hex(hook.secret, body);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mira-Event": event,
        "X-Mira-Signature": sig,
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const text = await res.text().catch(() => "");
    return {
      status: res.ok ? "ok" : "fail",
      httpCode: res.status,
      snippet: text.slice(0, 200),
    };
  } catch (err) {
    return {
      status: "fail",
      httpCode: null,
      snippet: String(err).slice(0, 200),
    };
  }
}

async function dispatchAndEnqueue(hook: Webhook, event: string, payload: unknown): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const res = await postWebhook(hook, event, payload);

  if (res.status === "ok") {
    db.insert(schema.webhookDeliveries)
      .values({
        webhookId: hook.id,
        event,
        payload: JSON.stringify(payload ?? {}),
        status: "ok",
        httpCode: res.httpCode,
        responseSnippet: res.snippet,
        attemptCount: 1,
        nextRetryAt: null,
        createdAt: now,
      })
      .run();
    db.update(schema.webhooks)
      .set({
        failCount: 0,
        lastDeliveredAt: now,
        status: hook.status === "failed" ? "active" : hook.status,
      })
      .where(eq(schema.webhooks.id, hook.id))
      .run();
    return;
  }

  // 失败:写 pending 等待重试队列
  db.insert(schema.webhookDeliveries)
    .values({
      webhookId: hook.id,
      event,
      payload: JSON.stringify(payload ?? {}),
      status: "pending",
      httpCode: res.httpCode,
      responseSnippet: res.snippet,
      attemptCount: 1,
      nextRetryAt: now + nextBackoffSeconds(1),
      createdAt: now,
    })
    .run();
}

export function fireWebhook(userId: number, event: WebhookEvent, payload: unknown): void {
  const hooks = db
    .select()
    .from(schema.webhooks)
    .where(and(eq(schema.webhooks.userId, userId), eq(schema.webhooks.status, "active")))
    .all();
  for (const h of hooks) {
    const events = parseEvents(h.event);
    if (!events.includes(event)) continue;
    // fire-and-forget; failure 会自动落 pending 队列
    void dispatchAndEnqueue(h, event, payload);
  }
}

export function broadcastWebhook(event: WebhookEvent, payload: unknown, userIds: number[]): void {
  const seen = new Set<number>();
  for (const uid of userIds) {
    if (seen.has(uid)) continue;
    seen.add(uid);
    fireWebhook(uid, event, payload);
  }
}

export function parseHookEvents(s: string): WebhookEvent[] {
  return parseEvents(s).filter((x): x is WebhookEvent =>
    (ALL_WEBHOOK_EVENTS as string[]).includes(x)
  );
}

// ---- 重试一次某条 delivery ----
export async function retryDelivery(d: WebhookDelivery): Promise<void> {
  const hook = db.select().from(schema.webhooks).where(eq(schema.webhooks.id, d.webhookId)).get();
  if (!hook) return;
  const now = Math.floor(Date.now() / 1000);
  let payload: unknown;
  try {
    payload = JSON.parse(d.payload);
  } catch {
    payload = {};
  }
  const res = await postWebhook(hook, d.event, payload);
  const nextAttempt = d.attemptCount + 1;

  if (res.status === "ok") {
    db.update(schema.webhookDeliveries)
      .set({
        status: "ok",
        httpCode: res.httpCode,
        responseSnippet: res.snippet,
        attemptCount: nextAttempt,
        nextRetryAt: null,
      })
      .where(eq(schema.webhookDeliveries.id, d.id))
      .run();
    db.update(schema.webhooks)
      .set({
        failCount: 0,
        lastDeliveredAt: now,
        status: hook.status === "failed" ? "active" : hook.status,
      })
      .where(eq(schema.webhooks.id, hook.id))
      .run();
    return;
  }

  // 还是失败
  if (nextAttempt >= MAX_ATTEMPTS) {
    db.update(schema.webhookDeliveries)
      .set({
        status: "fail",
        httpCode: res.httpCode,
        responseSnippet: res.snippet,
        attemptCount: nextAttempt,
        nextRetryAt: null,
      })
      .where(eq(schema.webhookDeliveries.id, d.id))
      .run();
    const newFail = hook.failCount + 1;
    const newStatus: "active" | "paused" | "failed" = newFail >= MAX_ATTEMPTS ? "paused" : "failed";
    db.update(schema.webhooks)
      .set({ failCount: newFail, status: newStatus, lastDeliveredAt: now })
      .where(eq(schema.webhooks.id, hook.id))
      .run();
    return;
  }

  // 排下一次
  db.update(schema.webhookDeliveries)
    .set({
      status: "pending",
      httpCode: res.httpCode,
      responseSnippet: res.snippet,
      attemptCount: nextAttempt,
      nextRetryAt: now + nextBackoffSeconds(nextAttempt),
    })
    .where(eq(schema.webhookDeliveries.id, d.id))
    .run();
}
