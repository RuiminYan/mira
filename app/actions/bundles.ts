"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { mintRecord } from "@/lib/chain";
import { computeContractSha, contractTitle } from "@/lib/contract";
import { notifyUser, ensureThread } from "@/lib/notify";
import type { Bundle, Quote } from "@/db/schema";

export async function placeBundleOrder(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/marketplace/bundles");
  if (u.role !== "partner" && u.role !== "admin") {
    redirect(`/marketplace/bundles?err=role`);
  }

  const bundleId = Number(formData.get("bundleId"));
  const projectName = String(formData.get("projectName") || "").trim();
  const scope = String(formData.get("scope") || "").trim();
  if (!bundleId || !projectName || !scope) {
    redirect(`/marketplace/bundles/${bundleId}?err=fields`);
  }

  const b = db.select().from(schema.bundles).where(eq(schema.bundles.id, bundleId)).get();
  if (!b || b.status !== "live") redirect(`/marketplace/bundles?err=notfound`);

  const items = db
    .select()
    .from(schema.bundleItems)
    .where(eq(schema.bundleItems.bundleId, bundleId))
    .all();
  if (items.length === 0) redirect(`/marketplace/bundles/${bundleId}?err=empty`);

  // pick first talent as the "primary" order target; all chain references inherit
  const primaryTalentId = items[0]!.talentId;
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, primaryTalentId)).get();
  if (!t) redirect(`/marketplace/bundles/${bundleId}?err=notfound`);

  const partner = db.select().from(schema.users).where(eq(schema.users.id, u.id)).get();
  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
  const now = Math.floor(Date.now() / 1000);

  const o = db
    .insert(schema.orders)
    .values({
      partnerId: u.id,
      talentId: primaryTalentId,
      projectName,
      scope: `${b.name} · ${scope}`,
      amount: b.priceTotal,
      share: t.revenueShare,
      status: "pending",
      bundleId: b.id,
      createdAt: now,
    })
    .returning()
    .get();

  db.insert(schema.revenues)
    .values({
      orderId: o.id,
      creatorId: t.creatorId,
      amount: b.priceTotal,
      kind: "license",
      note: `套餐授权 · ${b.name}`,
      createdAt: now,
    })
    .run();

  const draft = {
    kind: "order_license" as const,
    partyAName: partner?.nickname ?? "制作方",
    partyBName: creator?.nickname ?? "创作者",
    scope: `${b.name} · ${scope}`,
    amount: b.priceTotal,
    share: t.revenueShare,
    bodyHTMLPayload: {
      orderId: o.id,
      bundleId: b.id,
      bundleName: b.name,
      projectName,
      talentIds: items.map((i) => i.talentId),
    },
  };
  const sha = computeContractSha(draft, now);
  const c = db
    .insert(schema.contracts)
    .values({
      orderId: o.id,
      kind: "order_license",
      userId: t.creatorId,
      talentId: t.id,
      partyAName: draft.partyAName,
      partyBName: draft.partyBName,
      scope: draft.scope,
      amount: draft.amount,
      share: draft.share,
      signedAt: now,
      sha256: sha,
      createdAt: now,
    })
    .returning()
    .get();

  db.update(schema.orders).set({ contractId: c.id }).where(eq(schema.orders.id, o.id)).run();

  mintRecord("contracts", c.id, {
    kind: "order_license",
    title: contractTitle("order_license"),
    partyA: draft.partyAName,
    partyB: draft.partyBName,
    amount: draft.amount,
    share: draft.share,
    sha256: sha,
    signedAt: now,
  });

  mintRecord("orders", o.id, {
    event: "bundle_placed",
    bundleId: b.id,
    bundleName: b.name,
    talentIds: items.map((i) => i.talentId),
    amount: b.priceTotal,
    createdAt: now,
  });

  notifyUser(
    u.id,
    "order_pending",
    "orders",
    o.id,
    "套餐订单待支付",
    `${b.name} · ¥${b.priceTotal.toLocaleString()}`
  );
  ensureThread(
    "order",
    "orders",
    o.id,
    `套餐订单 · ${b.name}`,
    [
      { userId: u.id, role: "partner" },
      { userId: t.creatorId, role: "creator" },
    ]
  );

  redirect(`/partner/orders/${o.id}/pay`);
}

export async function createQuote(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/quotes");
  if (u.role !== "partner" && u.role !== "admin") {
    redirect("/marketplace");
  }

  const talentIdRaw = formData.get("talentId");
  const bundleIdRaw = formData.get("bundleId");
  const talentId = talentIdRaw ? Number(talentIdRaw) : null;
  const bundleId = bundleIdRaw ? Number(bundleIdRaw) : null;
  const projectName = String(formData.get("projectName") || "").trim();
  const scope = String(formData.get("scope") || "").trim();
  const offerAmount = Math.max(0, Math.floor(Number(formData.get("offerAmount") || 0)));
  const offerShare = Math.min(50, Math.max(0, Math.floor(Number(formData.get("offerShare") || 0))));

  if (!projectName || !scope || offerAmount <= 0) {
    redirect("/partner/quotes/new?err=fields");
  }

  let creatorId: number | null = null;
  let displayName = "";
  if (talentId) {
    const t = db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get();
    if (!t) redirect("/marketplace");
    creatorId = t.creatorId;
    displayName = t.stageName;
  } else if (bundleId) {
    const b = db.select().from(schema.bundles).where(eq(schema.bundles.id, bundleId)).get();
    if (!b) redirect("/marketplace/bundles");
    creatorId = b.creatorId;
    displayName = b.name;
  } else {
    redirect("/partner/quotes/new?err=target");
  }

  const now = Math.floor(Date.now() / 1000);
  const q = db
    .insert(schema.quotes)
    .values({
      partnerId: u.id,
      creatorId,
      talentId: talentId ?? null,
      bundleId: bundleId ?? null,
      projectName,
      scope,
      offerAmount,
      offerShare,
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
      amount: offerAmount,
      share: offerShare,
      note: `初始报价 · ${projectName}`,
      createdAt: now,
    })
    .run();

  if (creatorId) {
    notifyUser(
      creatorId,
      "quote_offer",
      "quotes",
      q.id,
      "收到议价请求",
      `${displayName} · ¥${offerAmount.toLocaleString()} · 分账 ${offerShare}%`
    );
    ensureThread(
      "quote",
      "quotes",
      q.id,
      `议价 · ${projectName}`,
      [
        { userId: u.id, role: "partner" },
        { userId: creatorId, role: "creator" },
      ]
    );
  }

  redirect(`/partner/quotes/${q.id}`);
}

export async function counterQuote(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id"));
  const amount = Math.max(0, Math.floor(Number(formData.get("amount") || 0)));
  const share = Math.min(50, Math.max(0, Math.floor(Number(formData.get("share") || 0))));
  const note = String(formData.get("note") || "").trim();
  if (!id || amount <= 0) redirect(`/partner/quotes/${id}?err=fields`);

  const q = db.select().from(schema.quotes).where(eq(schema.quotes.id, id)).get();
  if (!q) redirect("/partner/quotes");

  const isPartner = q.partnerId === u.id;
  const isCreator = q.creatorId === u.id;
  if (!isPartner && !isCreator && u.role !== "admin") {
    redirect("/marketplace");
  }
  if (!["submitted", "counter"].includes(q.status)) {
    redirect(isPartner ? `/partner/quotes/${id}` : `/creator/quotes/${id}`);
  }

  const now = Math.floor(Date.now() / 1000);
  db.insert(schema.quoteMessages)
    .values({
      quoteId: id,
      fromUserId: u.id,
      amount,
      share,
      note: note || "还价",
      createdAt: now,
    })
    .run();
  db.update(schema.quotes)
    .set({
      status: "counter",
      offerAmount: amount,
      offerShare: share,
      lastMessageBy: isPartner ? "partner" : "creator",
      updatedAt: now,
    })
    .where(eq(schema.quotes.id, id))
    .run();

  const target = isPartner ? q.creatorId : q.partnerId;
  if (target) {
    notifyUser(
      target,
      "quote_offer",
      "quotes",
      id,
      "对方提出新报价",
      `${q.projectName} · ¥${amount.toLocaleString()} · 分账 ${share}%`
    );
  }

  redirect(isPartner ? `/partner/quotes/${id}` : `/creator/quotes/${id}`);
}

export async function rejectQuote(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id"));
  const q = db.select().from(schema.quotes).where(eq(schema.quotes.id, id)).get();
  if (!q) redirect("/partner/quotes");
  const isPartner = q.partnerId === u.id;
  const isCreator = q.creatorId === u.id;
  if (!isPartner && !isCreator && u.role !== "admin") redirect("/marketplace");

  const now = Math.floor(Date.now() / 1000);
  db.update(schema.quotes)
    .set({ status: "rejected", updatedAt: now })
    .where(eq(schema.quotes.id, id))
    .run();
  const target = isPartner ? q.creatorId : q.partnerId;
  if (target) {
    notifyUser(
      target,
      "quote_rejected",
      "quotes",
      id,
      "议价已被拒绝",
      `${q.projectName}`
    );
  }
  redirect(isPartner ? "/partner/quotes" : "/creator/quotes");
}

export async function acceptQuote(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const id = Number(formData.get("id"));
  const q = db.select().from(schema.quotes).where(eq(schema.quotes.id, id)).get();
  if (!q) redirect("/partner/quotes");
  const isPartner = q.partnerId === u.id;
  const isCreator = q.creatorId === u.id;
  if (!isPartner && !isCreator && u.role !== "admin") redirect("/marketplace");
  if (!["submitted", "counter"].includes(q.status)) {
    redirect(isPartner ? `/partner/quotes/${id}` : `/creator/quotes/${id}`);
  }

  const orderId = await createOrderFromQuoteInternal(q);
  const now = Math.floor(Date.now() / 1000);
  db.update(schema.quotes)
    .set({ status: "accepted", updatedAt: now })
    .where(eq(schema.quotes.id, id))
    .run();

  mintRecord("quotes", q.id, {
    event: "accepted",
    quoteId: q.id,
    orderId,
    amount: q.offerAmount,
    share: q.offerShare,
    acceptedAt: now,
  });

  notifyUser(
    q.partnerId,
    "quote_accepted",
    "quotes",
    q.id,
    "议价已成交",
    `${q.projectName} · ¥${q.offerAmount.toLocaleString()}`
  );
  if (q.creatorId) {
    notifyUser(
      q.creatorId,
      "quote_accepted",
      "quotes",
      q.id,
      "议价已成交",
      `${q.projectName} · ¥${q.offerAmount.toLocaleString()}`
    );
  }

  redirect(`/partner/orders/${orderId}/pay`);
}

async function createOrderFromQuoteInternal(q: Quote): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  let talentId = q.talentId;
  let bundle: Bundle | null = null;
  if (q.bundleId) {
    bundle = db.select().from(schema.bundles).where(eq(schema.bundles.id, q.bundleId)).get() ?? null;
    if (bundle) {
      const items = db
        .select()
        .from(schema.bundleItems)
        .where(eq(schema.bundleItems.bundleId, bundle.id))
        .all();
      if (items.length > 0) talentId = items[0]!.talentId;
    }
  }
  if (!talentId) throw new Error("QUOTE_NO_TARGET");

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get();
  if (!t) throw new Error("QUOTE_NO_TALENT");
  const partner = db.select().from(schema.users).where(eq(schema.users.id, q.partnerId)).get();
  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();

  const o = db
    .insert(schema.orders)
    .values({
      partnerId: q.partnerId,
      talentId,
      projectName: q.projectName,
      scope: bundle ? `${bundle.name} · ${q.scope}` : q.scope,
      amount: q.offerAmount,
      share: q.offerShare,
      status: "pending",
      bundleId: bundle?.id ?? null,
      createdAt: now,
    })
    .returning()
    .get();

  db.insert(schema.revenues)
    .values({
      orderId: o.id,
      creatorId: t.creatorId,
      amount: q.offerAmount,
      kind: "license",
      note: `议价授权 · ${q.projectName}`,
      createdAt: now,
    })
    .run();

  const draft = {
    kind: "order_license" as const,
    partyAName: partner?.nickname ?? "制作方",
    partyBName: creator?.nickname ?? "创作者",
    scope: bundle ? `${bundle.name} · ${q.scope}` : q.scope,
    amount: q.offerAmount,
    share: q.offerShare,
    bodyHTMLPayload: {
      orderId: o.id,
      quoteId: q.id,
      projectName: q.projectName,
    },
  };
  const sha = computeContractSha(draft, now);
  const c = db
    .insert(schema.contracts)
    .values({
      orderId: o.id,
      kind: "order_license",
      userId: t.creatorId,
      talentId: t.id,
      partyAName: draft.partyAName,
      partyBName: draft.partyBName,
      scope: draft.scope,
      amount: draft.amount,
      share: draft.share,
      signedAt: now,
      sha256: sha,
      createdAt: now,
    })
    .returning()
    .get();
  db.update(schema.orders).set({ contractId: c.id }).where(eq(schema.orders.id, o.id)).run();

  mintRecord("contracts", c.id, {
    kind: "order_license",
    title: contractTitle("order_license"),
    partyA: draft.partyAName,
    partyB: draft.partyBName,
    amount: draft.amount,
    share: draft.share,
    sha256: sha,
    signedAt: now,
  });

  return o.id;
}
