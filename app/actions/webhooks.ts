"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { generateSecret, fireWebhook, ALL_WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/webhooks";

export async function createWebhook(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/webhooks");
  const url = String(formData.get("url") || "").trim();
  const events = formData
    .getAll("event")
    .map(String)
    .filter((e) => (ALL_WEBHOOK_EVENTS as string[]).includes(e));
  if (!/^https?:\/\//i.test(url)) redirect("/me/webhooks?err=url");
  if (events.length === 0) redirect("/me/webhooks?err=events");
  db.insert(schema.webhooks)
    .values({
      userId: u.id,
      url,
      event: JSON.stringify(events),
      secret: generateSecret(),
      status: "active",
      failCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
  redirect("/me/webhooks?ok=create");
}

export async function pauseWebhook(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/webhooks");
  const id = Number(formData.get("id"));
  const h = db.select().from(schema.webhooks).where(eq(schema.webhooks.id, id)).get();
  if (!h || h.userId !== u.id) redirect("/me/webhooks?err=perm");
  db.update(schema.webhooks)
    .set({ status: h.status === "paused" ? "active" : "paused", failCount: h.status === "paused" ? 0 : h.failCount })
    .where(eq(schema.webhooks.id, id))
    .run();
  redirect("/me/webhooks?ok=toggle");
}

export async function deleteWebhook(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/webhooks");
  const id = Number(formData.get("id"));
  const h = db.select().from(schema.webhooks).where(eq(schema.webhooks.id, id)).get();
  if (!h || h.userId !== u.id) redirect("/me/webhooks?err=perm");
  db.delete(schema.webhookDeliveries).where(eq(schema.webhookDeliveries.webhookId, id)).run();
  db.delete(schema.webhooks).where(eq(schema.webhooks.id, id)).run();
  redirect("/me/webhooks?ok=delete");
}

export async function testWebhook(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/webhooks");
  const id = Number(formData.get("id"));
  const eventRaw = String(formData.get("event") || "order.paid");
  const h = db.select().from(schema.webhooks).where(eq(schema.webhooks.id, id)).get();
  if (!h || h.userId !== u.id) redirect("/me/webhooks?err=perm");
  const event: WebhookEvent = (ALL_WEBHOOK_EVENTS as string[]).includes(eventRaw)
    ? (eventRaw as WebhookEvent)
    : "order.paid";
  fireWebhook(u.id, event, {
    test: true,
    sample: {
      orderId: 9999,
      projectName: "示例项目 · TEST",
      amount: 1200,
      at: Math.floor(Date.now() / 1000),
    },
  });
  redirect("/me/webhooks?ok=test");
}
