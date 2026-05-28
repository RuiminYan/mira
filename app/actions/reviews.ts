"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/review";
import { notifyUser } from "@/lib/notify";
import { logAction } from "@/lib/audit";
import { fireWebhook } from "@/lib/webhooks";

export async function submitReview(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const orderId = Number(formData.get("orderId"));
  const rating = Math.max(1, Math.min(5, Number(formData.get("rating") || 0)));
  const body = String(formData.get("body") || "").trim().slice(0, 500);
  const tagsRaw = formData.getAll("tags").map((t) => String(t)).filter(Boolean);
  const tags = JSON.stringify(tagsRaw.slice(0, 8));

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) redirect("/notifications?err=order");
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  if (!t) redirect("/notifications?err=talent");

  let role: "partner_to_creator" | "creator_to_partner";
  let toUserId: number;
  if (u.id === o.partnerId) {
    role = "partner_to_creator";
    toUserId = t.creatorId;
  } else if (u.id === t.creatorId) {
    role = "creator_to_partner";
    toUserId = o.partnerId;
  } else {
    redirect("/notifications?err=role");
  }

  const ok = canReview(orderId, u.id, role!);
  if (!ok.ok) {
    const back = u.role === "creator" ? `/creator/orders/${orderId}` : `/partner/orders/${orderId}`;
    redirect(`${back}?err=review`);
  }

  const r = db
    .insert(schema.reviews)
    .values({
      orderId,
      fromUserId: u.id,
      toUserId: toUserId!,
      role: role!,
      rating,
      body,
      tags,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();
  notifyUser(toUserId!, "review_received", "orders", orderId, "你收到了一条新评价", `评分 ${rating}/5`);
  logAction(u, "review_submitted", "reviews", r.id, null, r, `评价订单 #${orderId}`);

  fireWebhook(toUserId!, "review.created", {
    reviewId: r.id,
    orderId,
    rating,
    role: role!,
  });

  const back = u.role === "creator" ? `/creator/orders/${orderId}` : `/partner/orders/${orderId}`;
  redirect(`${back}?ok=review`);
}
