"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { JOB_COSTS, CREDIT_TIERS, getCredits, grantCredits, spendCredits } from "@/lib/studio";
import { mintRecord } from "@/lib/chain";
import { getNftByTalentId } from "@/lib/nft";

export async function submitStudioJob(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio");
  if (u.role !== "creator" && u.role !== "partner" && u.role !== "admin")
    redirect("/studio?err=role");

  const kind = String(formData.get("kind") || "image") as "image" | "video" | "tts";
  if (!["image", "video", "tts"].includes(kind)) redirect("/studio?err=kind");
  const talentId = Number(formData.get("talentId"));
  if (!Number.isFinite(talentId)) redirect("/studio?err=talent");
  const prompt = String(formData.get("prompt") || "").trim();
  if (prompt.length < 4) redirect(`/studio/jobs/new?kind=${kind}&talentId=${talentId}&err=prompt`);

  const talent = db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get();
  if (!talent) redirect("/studio?err=talent");
  if (talent.status === "taken_down") redirect("/studio?err=takendown");
  const nft = getNftByTalentId(talentId);
  if (!nft) redirect("/studio?err=unminted");

  const cost = JOB_COSTS[kind];
  // ensure credits row exists
  getCredits(u.id);
  const ok = spendCredits(u.id, cost);
  if (!ok) redirect(`/studio/credits?err=balance`);

  const now = Math.floor(Date.now() / 1000);
  // sync "finish" 4s later via finishedAt
  const finishedAt = now + 4;
  const outputUrl =
    kind === "image"
      ? `/studio/output/img_${now}.png`
      : kind === "video"
        ? `/studio/output/clip_${now}.mp4`
        : `/studio/output/tts_${now}.mp3`;
  const inserted = db
    .insert(schema.studioJobs)
    .values({
      userId: u.id,
      talentId,
      kind,
      prompt,
      status: "queued",
      outputUrl,
      costCredits: cost,
      durationMs: 4000,
      chainRecordId: null,
      createdAt: now,
      finishedAt,
    })
    .returning()
    .get();

  if (kind === "video") {
    const chain = mintRecord("studio_jobs", inserted.id, {
      userId: u.id,
      talentId,
      kind,
      promptHashLen: prompt.length,
      outputUrl,
      at: now,
    });
    db.update(schema.studioJobs)
      .set({ chainRecordId: chain.id })
      .where(eq(schema.studioJobs.id, inserted.id))
      .run();
  }

  redirect(`/studio/jobs/${inserted.id}`);
}

export async function rechargeCredits(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio/credits");

  const tier = String(formData.get("tier") || "");
  const found = CREDIT_TIERS.find((t) => t.id === tier);
  if (!found) redirect("/studio/credits?err=tier");

  const now = Math.floor(Date.now() / 1000);
  const inserted = db
    .insert(schema.studioRecharges)
    .values({
      userId: u.id,
      rmb: found.rmb,
      credits: found.credits,
      chainRecordId: null,
      createdAt: now,
    })
    .returning()
    .get();
  grantCredits(u.id, found.credits);

  const chain = mintRecord("studio_recharges", inserted.id, {
    userId: u.id,
    rmb: found.rmb,
    credits: found.credits,
    at: now,
  });
  db.update(schema.studioRecharges)
    .set({ chainRecordId: chain.id })
    .where(eq(schema.studioRecharges.id, inserted.id))
    .run();

  redirect("/studio/credits?ok=1");
}
