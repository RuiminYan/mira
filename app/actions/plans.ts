"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export async function submitEnterpriseLead(formData: FormData): Promise<void> {
  const company = String(formData.get("company") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const employees = String(formData.get("employees") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const requirement = String(formData.get("requirement") || "").trim().slice(0, 500);
  if (!company || !contactName || !email.includes("@")) redirect("/pricing?err=fields");
  db.insert(schema.enterpriseLeads)
    .values({
      company,
      contactName,
      email,
      phone,
      employees,
      industry,
      requirement,
      source: "pricing_form",
      status: "new",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
  redirect("/pricing?ok=lead");
}

export async function changeSubscription(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/subscription");
  const planCode = String(formData.get("planCode") || "");
  const plan = db.select().from(schema.plans).where(eq(schema.plans.code, planCode)).get();
  if (!plan) redirect("/me/subscription?err=plan");
  const now = Math.floor(Date.now() / 1000);
  const existing = db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, u.id))
    .get();
  if (existing) {
    db.update(schema.subscriptions)
      .set({
        planId: plan.id,
        status: "active",
        startedAt: now,
        endsAt: now + 86400 * 30,
        nextChargeAt: now + 86400 * 30,
        autoRenew: true,
      })
      .where(eq(schema.subscriptions.id, existing.id))
      .run();
  } else {
    db.insert(schema.subscriptions)
      .values({
        userId: u.id,
        planId: plan.id,
        status: "active",
        startedAt: now,
        endsAt: now + 86400 * 30,
        autoRenew: true,
        nextChargeAt: now + 86400 * 30,
        createdAt: now,
      })
      .run();
  }
  redirect("/me/subscription?ok=change");
}

export async function cancelSubscription(): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/subscription");
  const sub = db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, u.id)).get();
  if (!sub) redirect("/me/subscription?err=none");
  db.update(schema.subscriptions)
    .set({ status: "cancelled", autoRenew: false })
    .where(eq(schema.subscriptions.id, sub.id))
    .run();
  redirect("/me/subscription?ok=cancel");
}

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/enterprise-leads");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "new") as "new" | "contacted" | "won" | "lost";
  db.update(schema.enterpriseLeads)
    .set({ status })
    .where(eq(schema.enterpriseLeads.id, id))
    .run();
  redirect("/admin/enterprise-leads?ok=1");
}

export async function archivePlan(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/plans");
  const id = Number(formData.get("id"));
  const p = db.select().from(schema.plans).where(eq(schema.plans.id, id)).get();
  if (!p) redirect("/admin/plans");
  db.update(schema.plans)
    .set({ status: p.status === "live" ? "archived" : "live" })
    .where(eq(schema.plans.id, id))
    .run();
  redirect("/admin/plans?ok=toggle");
}
