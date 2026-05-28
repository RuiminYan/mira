"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export async function updateCsmAssignment(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/csm");
  const id = Number(formData.get("id"));
  const tier = String(formData.get("tier") || "standard") as "vip" | "standard" | "inactive";
  const nextCheckinRaw = String(formData.get("nextCheckinAt") || "").trim();
  const tagsRaw = String(formData.get("tags") || "").trim();
  let nextCheckinAt: number | null = null;
  if (nextCheckinRaw) {
    const parsed = Date.parse(nextCheckinRaw);
    if (!Number.isNaN(parsed)) nextCheckinAt = Math.floor(parsed / 1000);
  }
  const tags = JSON.stringify(
    tagsRaw
      .split(/[,，、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8)
  );
  db.update(schema.csmAssignments)
    .set({ tier, nextCheckinAt, tags })
    .where(eq(schema.csmAssignments.id, id))
    .run();
  redirect(`/admin/csm/${id}?ok=1`);
}

export async function recordCsmTouch(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/csm");
  const assignmentId = Number(formData.get("assignmentId"));
  const kind = String(formData.get("kind") || "note") as "call" | "email" | "meeting" | "note";
  const summary = String(formData.get("summary") || "").trim().slice(0, 500);
  const nextAction = String(formData.get("nextAction") || "").trim().slice(0, 200) || null;
  if (!summary) redirect(`/admin/csm/${assignmentId}?err=summary`);
  db.insert(schema.csmTouches)
    .values({
      assignmentId,
      csmId: u.id,
      kind,
      summary,
      nextAction,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
  redirect(`/admin/csm/${assignmentId}?ok=touch`);
}
