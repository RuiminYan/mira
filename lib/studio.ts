import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { StudioJob, StudioCredit } from "@/db/schema";

export const JOB_COSTS: Record<"image" | "video" | "tts", number> = {
  image: 10,
  video: 50,
  tts: 20,
};

export const CREDIT_TIERS: { id: string; rmb: number; credits: number }[] = [
  { id: "s", rmb: 100, credits: 1000 },
  { id: "m", rmb: 500, credits: 5500 },
  { id: "l", rmb: 2000, credits: 24000 },
  { id: "xl", rmb: 10000, credits: 120000 },
];

export function getCredits(userId: number): StudioCredit {
  const row = db.select().from(schema.studioCredits).where(eq(schema.studioCredits.userId, userId)).get();
  if (row) return row;
  const now = Math.floor(Date.now() / 1000);
  const inserted = db
    .insert(schema.studioCredits)
    .values({
      userId,
      balance: 0,
      lifetimeRecharged: 0,
      lifetimeUsed: 0,
      updatedAt: now,
    })
    .returning()
    .get();
  return inserted;
}

export function spendCredits(userId: number, amount: number): boolean {
  const cur = getCredits(userId);
  if (cur.balance < amount) return false;
  db.update(schema.studioCredits)
    .set({
      balance: cur.balance - amount,
      lifetimeUsed: cur.lifetimeUsed + amount,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(schema.studioCredits.userId, userId))
    .run();
  return true;
}

export function grantCredits(userId: number, amount: number): void {
  const cur = getCredits(userId);
  db.update(schema.studioCredits)
    .set({
      balance: cur.balance + amount,
      lifetimeRecharged: cur.lifetimeRecharged + amount,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(schema.studioCredits.userId, userId))
    .run();
}

export function recentJobs(userId: number, limit = 5): StudioJob[] {
  return db
    .select()
    .from(schema.studioJobs)
    .where(eq(schema.studioJobs.userId, userId))
    .orderBy(desc(schema.studioJobs.createdAt))
    .limit(limit)
    .all();
}

export function listJobs(userId: number): StudioJob[] {
  return db
    .select()
    .from(schema.studioJobs)
    .where(eq(schema.studioJobs.userId, userId))
    .orderBy(desc(schema.studioJobs.createdAt))
    .all();
}

export function getJob(id: number): StudioJob | null {
  const r = db.select().from(schema.studioJobs).where(eq(schema.studioJobs.id, id)).get();
  return r ?? null;
}

export function effectiveJobStatus(job: StudioJob): "queued" | "running" | "done" | "failed" {
  if (job.status === "failed") return "failed";
  if (job.status === "done") return "done";
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - job.createdAt;
  if (job.finishedAt && now >= job.finishedAt) return "done";
  if (elapsed < 4) return "queued";
  if (elapsed < 12) return "running";
  return "done";
}

export function totalJobsCount(): number {
  const r = db.select({ c: sql<number>`count(*)` }).from(schema.studioJobs).get();
  return r?.c ?? 0;
}

export function totalCreditsUsed(): number {
  const r = db
    .select({ c: sql<number>`coalesce(sum(${schema.studioCredits.lifetimeUsed}),0)` })
    .from(schema.studioCredits)
    .get();
  return r?.c ?? 0;
}
