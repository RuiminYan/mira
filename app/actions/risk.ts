"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function resolveRiskFlag(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/risk");
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision") || "cleared");
  const f = db.select().from(schema.riskFlags).where(eq(schema.riskFlags.id, id)).get();
  if (!f) redirect("/admin/risk");
  const now = Math.floor(Date.now() / 1000);
  if (decision === "banned") {
    db.update(schema.riskFlags)
      .set({ status: "banned", reviewedBy: u.id, resolvedAt: now })
      .where(eq(schema.riskFlags.id, id))
      .run();
    db.update(schema.users)
      .set({ banned: true })
      .where(eq(schema.users.id, f.userId))
      .run();
  } else if (decision === "reviewing") {
    db.update(schema.riskFlags)
      .set({ status: "reviewing", reviewedBy: u.id })
      .where(eq(schema.riskFlags.id, id))
      .run();
  } else {
    db.update(schema.riskFlags)
      .set({ status: "cleared", reviewedBy: u.id, resolvedAt: now })
      .where(eq(schema.riskFlags.id, id))
      .run();
  }
  logAction(u, "risk_resolved", "risk_flags", id, f, { ...f, status: decision }, `风控 → ${decision}`);
  redirect("/admin/risk");
}

export async function unbanUser(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/risk");
  const id = Number(formData.get("userId"));
  const target = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!target) redirect("/admin/risk");
  db.update(schema.users)
    .set({ banned: false })
    .where(eq(schema.users.id, id))
    .run();
  logAction(u, "user_unbanned", "users", id, target, { ...target, banned: false }, `解封用户 #${id}`);
  redirect("/admin/risk");
}
