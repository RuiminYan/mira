"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function createCoupon(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/coupons");
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const kind = String(formData.get("kind") || "discount_pct") as
    | "discount_pct"
    | "discount_fix"
    | "credits";
  const value = Number(formData.get("value") || 0);
  const minSpendYuan = Number(formData.get("minSpend") || 0);
  const quota = Number(formData.get("quota") || 0);
  const startsAt = Math.floor(Date.now() / 1000);
  const endsAtRaw = String(formData.get("endsAt") || "");
  const endsAt = endsAtRaw ? Math.floor(new Date(endsAtRaw).getTime() / 1000) : null;
  if (!code || !value) redirect("/admin/coupons?err=fields");
  if (kind === "discount_pct" && (value < 1 || value > 100))
    redirect("/admin/coupons?err=pct");

  const existing = db.select().from(schema.coupons).where(eq(schema.coupons.code, code)).get();
  if (existing) redirect("/admin/coupons?err=dup");

  const r = db
    .insert(schema.coupons)
    .values({
      code,
      kind,
      value,
      minSpend: Math.max(0, Math.floor(minSpendYuan * 100)),
      scope: "global",
      scopeRefId: null,
      quota: Math.max(0, Math.floor(quota)),
      used: 0,
      status: "live",
      startsAt,
      endsAt,
      createdAt: startsAt,
    })
    .returning()
    .get();

  logAction(u, "coupon_created", "coupons", r.id, null, r, `优惠券 ${code}`);
  redirect("/admin/coupons?ok=1");
}

export async function archiveCoupon(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/coupons");
  const id = Number(formData.get("id"));
  const before = db.select().from(schema.coupons).where(eq(schema.coupons.id, id)).get();
  if (!before) redirect("/admin/coupons");
  db.update(schema.coupons)
    .set({ status: "archived" })
    .where(eq(schema.coupons.id, id))
    .run();
  logAction(u, "coupon_archived", "coupons", id, before, { ...before, status: "archived" }, `归档 ${before.code}`);
  redirect("/admin/coupons");
}

export async function reactivateCoupon(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/coupons");
  const id = Number(formData.get("id"));
  db.update(schema.coupons)
    .set({ status: "live" })
    .where(eq(schema.coupons.id, id))
    .run();
  redirect("/admin/coupons");
}
