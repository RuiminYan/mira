"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function sendMessage(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const threadId = Number(formData.get("threadId"));
  const body = String(formData.get("body") || "").trim();
  if (!threadId || body.length === 0) redirect(`/messages/${threadId}?err=empty`);

  const me = db
    .select()
    .from(schema.threadParticipants)
    .where(
      and(
        eq(schema.threadParticipants.threadId, threadId),
        eq(schema.threadParticipants.userId, u.id)
      )
    )
    .get();
  if (!me && u.role !== "admin") redirect("/messages");

  const now = Math.floor(Date.now() / 1000);
  db.insert(schema.messages)
    .values({
      threadId,
      fromUserId: u.id,
      body,
      createdAt: now,
    })
    .run();
  db.update(schema.threads)
    .set({ lastMessageAt: now })
    .where(eq(schema.threads.id, threadId))
    .run();

  // increment unread for other participants
  const others = db
    .select()
    .from(schema.threadParticipants)
    .where(
      and(
        eq(schema.threadParticipants.threadId, threadId),
        ne(schema.threadParticipants.userId, u.id)
      )
    )
    .all();
  for (const p of others) {
    db.update(schema.threadParticipants)
      .set({ unread: p.unread + 1 })
      .where(eq(schema.threadParticipants.id, p.id))
      .run();
    notifyUser(
      p.userId,
      "new_message",
      "threads",
      threadId,
      "新私信",
      body.length > 60 ? body.slice(0, 60) + "…" : body
    );
  }

  redirect(`/messages/${threadId}`);
}

export async function markAllRead() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const now = Math.floor(Date.now() / 1000);
  db.update(schema.notifications)
    .set({ readAt: now })
    .where(eq(schema.notifications.userId, u.id))
    .run();
  // also clear thread unread counts
  const mine = db
    .select()
    .from(schema.threadParticipants)
    .where(eq(schema.threadParticipants.userId, u.id))
    .all();
  for (const p of mine) {
    if (p.unread > 0) {
      db.update(schema.threadParticipants)
        .set({ unread: 0 })
        .where(eq(schema.threadParticipants.id, p.id))
        .run();
    }
  }
  redirect("/notifications");
}

export async function markThreadRead(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const threadId = Number(formData.get("threadId"));
  db.update(schema.threadParticipants)
    .set({ unread: 0 })
    .where(
      and(
        eq(schema.threadParticipants.threadId, threadId),
        eq(schema.threadParticipants.userId, u.id)
      )
    )
    .run();
  redirect(`/messages/${threadId}`);
}

export async function findByPhoto(formData: FormData) {
  // image url is set from client side after upload; redirect with query
  const url = String(formData.get("url") || "").trim();
  if (!url) redirect("/marketplace/search/face?err=upload");
  redirect(`/marketplace/search/face?url=${encodeURIComponent(url)}`);
}

export async function verifyFingerprint(formData: FormData) {
  const fp = String(formData.get("fp") || "").trim();
  if (!fp || !/^[0-9a-f]{32,64}$/i.test(fp)) {
    redirect("/verify?err=fp");
  }
  redirect(`/verify?fp=${encodeURIComponent(fp)}`);
}
