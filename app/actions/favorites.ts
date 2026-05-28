"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureThread, notifyUser } from "@/lib/notify";

export async function toggleFavorite(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const talentId = Number(formData.get("talentId"));
  if (!talentId) redirect("/marketplace");
  const existing = db
    .select()
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, u.id),
        eq(schema.favorites.talentId, talentId),
        eq(schema.favorites.list, "default")
      )
    )
    .get();
  if (existing) {
    db.delete(schema.favorites).where(eq(schema.favorites.id, existing.id)).run();
  } else {
    db.insert(schema.favorites)
      .values({
        userId: u.id,
        talentId,
        list: "default",
        note: "",
        createdAt: Math.floor(Date.now() / 1000),
      })
      .run();
  }
  redirect(`/marketplace/${talentId}`);
}

export async function createShortlist(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const name = String(formData.get("name") || "").trim().slice(0, 50);
  const description = String(formData.get("description") || "").trim().slice(0, 200);
  if (!name) redirect("/partner/shortlists?err=name");
  const r = db
    .insert(schema.shortlists)
    .values({
      userId: u.id,
      name,
      description,
      shareToken: null,
      shareExpiresAt: null,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();
  redirect(`/partner/shortlists/${r.id}`);
}

export async function addToShortlist(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const shortlistId = Number(formData.get("shortlistId"));
  const talentId = Number(formData.get("talentId"));
  const list = db
    .select()
    .from(schema.shortlists)
    .where(and(eq(schema.shortlists.id, shortlistId), eq(schema.shortlists.userId, u.id)))
    .get();
  if (!list) redirect("/partner/shortlists");
  const existing = db
    .select()
    .from(schema.shortlistItems)
    .where(
      and(
        eq(schema.shortlistItems.shortlistId, shortlistId),
        eq(schema.shortlistItems.talentId, talentId)
      )
    )
    .get();
  if (existing) {
    redirect(`/partner/shortlists/${shortlistId}`);
  }
  const cur = db
    .select()
    .from(schema.shortlistItems)
    .where(eq(schema.shortlistItems.shortlistId, shortlistId))
    .all();
  db.insert(schema.shortlistItems)
    .values({ shortlistId, talentId, note: "", order: cur.length })
    .run();
  redirect(`/partner/shortlists/${shortlistId}`);
}

export async function reorderShortlistItem(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const itemId = Number(formData.get("itemId"));
  const direction = String(formData.get("direction") || "up");
  const item = db
    .select()
    .from(schema.shortlistItems)
    .where(eq(schema.shortlistItems.id, itemId))
    .get();
  if (!item) redirect("/partner/shortlists");
  const list = db
    .select()
    .from(schema.shortlists)
    .where(eq(schema.shortlists.id, item.shortlistId))
    .get();
  if (!list || list.userId !== u.id) redirect("/partner/shortlists");
  const siblings = db
    .select()
    .from(schema.shortlistItems)
    .where(eq(schema.shortlistItems.shortlistId, item.shortlistId))
    .all()
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((s) => s.id === itemId);
  const swapWith = direction === "up" ? siblings[idx - 1] : siblings[idx + 1];
  if (!swapWith) redirect(`/partner/shortlists/${item.shortlistId}`);
  db.update(schema.shortlistItems)
    .set({ order: swapWith!.order })
    .where(eq(schema.shortlistItems.id, item.id))
    .run();
  db.update(schema.shortlistItems)
    .set({ order: item.order })
    .where(eq(schema.shortlistItems.id, swapWith!.id))
    .run();
  redirect(`/partner/shortlists/${item.shortlistId}`);
}

export async function removeShortlistItem(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const itemId = Number(formData.get("itemId"));
  const item = db
    .select()
    .from(schema.shortlistItems)
    .where(eq(schema.shortlistItems.id, itemId))
    .get();
  if (!item) redirect("/partner/shortlists");
  const list = db
    .select()
    .from(schema.shortlists)
    .where(eq(schema.shortlists.id, item.shortlistId))
    .get();
  if (!list || list.userId !== u.id) redirect("/partner/shortlists");
  db.delete(schema.shortlistItems).where(eq(schema.shortlistItems.id, itemId)).run();
  redirect(`/partner/shortlists/${item.shortlistId}`);
}

export async function bulkQuoteFromShortlist(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const shortlistId = Number(formData.get("shortlistId"));
  const message = String(formData.get("message") || "").trim().slice(0, 500);
  const list = db
    .select()
    .from(schema.shortlists)
    .where(and(eq(schema.shortlists.id, shortlistId), eq(schema.shortlists.userId, u.id)))
    .get();
  if (!list) redirect("/partner/shortlists");

  const items = db
    .select({ i: schema.shortlistItems, t: schema.talents })
    .from(schema.shortlistItems)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.shortlistItems.talentId))
    .where(eq(schema.shortlistItems.shortlistId, shortlistId))
    .all();
  if (items.length === 0) redirect(`/partner/shortlists/${shortlistId}?err=empty`);

  const now = Math.floor(Date.now() / 1000);
  let created = 0;
  for (const row of items) {
    const t = row.t;
    if (!t || t.status !== "live") continue;
    const q = db
      .insert(schema.quotes)
      .values({
        partnerId: u.id,
        creatorId: t.creatorId,
        talentId: t.id,
        bundleId: null,
        projectName: list.name,
        scope: `选角清单整单议价 · ${list.name}`,
        offerAmount: t.priceOnce,
        offerShare: t.revenueShare,
        status: "submitted",
        lastMessageBy: "partner",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
    db.insert(schema.quoteMessages)
      .values({
        quoteId: q.id,
        fromUserId: u.id,
        amount: t.priceOnce,
        share: t.revenueShare,
        note: message || `整单议价 · 来自清单「${list.name}」`,
        createdAt: now,
      })
      .run();
    notifyUser(
      t.creatorId,
      "quote_offer",
      "quotes",
      q.id,
      "收到整单议价请求",
      `${t.stageName} · 来自清单「${list.name}」`
    );
    ensureThread(
      "quote",
      "quotes",
      q.id,
      `整单议价 · ${list.name}`,
      [
        { userId: u.id, role: "partner" },
        { userId: t.creatorId, role: "creator" },
      ]
    );
    created++;
  }

  redirect(`/partner/quotes?from=shortlist&n=${created}`);
}

export async function shareShortlist(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const id = Number(formData.get("id"));
  const list = db
    .select()
    .from(schema.shortlists)
    .where(and(eq(schema.shortlists.id, id), eq(schema.shortlists.userId, u.id)))
    .get();
  if (!list) redirect("/partner/shortlists");
  const token = crypto.randomBytes(12).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  db.update(schema.shortlists)
    .set({ shareToken: token, shareExpiresAt: expiresAt })
    .where(eq(schema.shortlists.id, id))
    .run();
  redirect(`/partner/shortlists/${id}?ok=share`);
}
