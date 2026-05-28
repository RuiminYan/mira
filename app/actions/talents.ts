"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { mintRecord } from "@/lib/chain";
import { mintNft } from "@/lib/nft";
import { notifyUser, notifyAdmins } from "@/lib/notify";
import { logAction } from "@/lib/audit";
import { recordActivity, activityForTalentListed } from "@/lib/activity";
import { fireWebhook } from "@/lib/webhooks";

const COVERS = [
  "linear-gradient(135deg,#6E59F6 0%,#FF6FB4 100%)",
  "linear-gradient(135deg,#FF8FB1 0%,#FFC796 100%)",
  "linear-gradient(135deg,#5340D9 0%,#1E1B4B 100%)",
  "linear-gradient(135deg,#22D3EE 0%,#6E59F6 100%)",
  "linear-gradient(135deg,#FBBF24 0%,#F87171 100%)",
  "linear-gradient(135deg,#0EA5E9 0%,#6E59F6 100%)",
  "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 100%)",
  "linear-gradient(135deg,#FF6FB4 0%,#6E59F6 60%,#1E1B4B 100%)",
];

export async function createTalent(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/talents/new");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  if (u.role === "creator" && !u.verified) redirect("/creator/verify?next=/creator/talents/new");

  const stageName = String(formData.get("stageName") || "").trim();
  const gender = String(formData.get("gender") || "female") as "female" | "male" | "neutral";
  const ageBand = String(formData.get("ageBand") || "").trim();
  const styleTags = String(formData.get("styleTags") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const priceOnce = Number(formData.get("priceOnce")) || 300;
  const revenueShare = Math.min(20, Math.max(0, Number(formData.get("revenueShare")) || 5));
  const exclusive = formData.get("exclusive") === "1";
  const grade = String(formData.get("grade") || "B") as "S" | "A" | "B";
  const followers = Number(formData.get("followers")) || 0;
  const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") || "").trim() || null;

  if (!stageName || !ageBand || !styleTags || !bio) {
    redirect("/creator/talents/new?err=fields");
  }

  const cover = COVERS[Math.floor(Math.random() * COVERS.length)]!;

  db.insert(schema.talents)
    .values({
      creatorId: u.id,
      stageName,
      gender,
      ageBand,
      styleTags,
      cover,
      avatarUrl,
      videoUrl,
      bio,
      followers,
      grade,
      priceOnce,
      revenueShare,
      exclusive,
      status: "review",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();

  redirect("/creator");
}

export async function approveTalent(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin");

  const id = Number(formData.get("id"));
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, id)).get();
  if (!t) redirect("/admin");

  db.update(schema.talents).set({ status: "live" }).where(eq(schema.talents.id, id)).run();

  mintRecord("talents", t.id, {
    stageName: t.stageName,
    creatorId: t.creatorId,
    grade: t.grade,
    priceOnce: t.priceOnce,
    revenueShare: t.revenueShare,
    approvedAt: Math.floor(Date.now() / 1000),
  });

  // Auto-mint NFT to original creator when listing
  mintNft(t.id, t.creatorId);

  notifyUser(
    t.creatorId,
    "talent_approved",
    "talents",
    t.id,
    "形象已上线",
    `${t.stageName} 已通过审核进入选角广场。`
  );

  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
  recordActivity(
    "talent_listed",
    t.creatorId,
    "talents",
    t.id,
    activityForTalentListed({
      talentName: t.stageName,
      creatorNickname: creator?.nickname ?? "",
      grade: t.grade,
    })
  );
  logAction(u, "talent_approved", "talents", t.id, { status: "review" }, { status: "live" }, `形象 ${t.stageName} 上架`);

  fireWebhook(t.creatorId, "talent.approved", {
    talentId: t.id,
    stageName: t.stageName,
    grade: t.grade,
    approvedAt: Math.floor(Date.now() / 1000),
  });

  redirect("/admin");
}

export async function requestTakedown(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");
  if (u.role === "creator" && !u.verified) redirect("/creator/verify");

  const talentId = Number(formData.get("talentId"));
  const reason = String(formData.get("reason") || "").trim();
  if (!talentId || reason.length < 5) redirect(`/creator/talents/${talentId}?err=reason`);

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get();
  if (!t || t.creatorId !== u.id) redirect("/creator/talents");

  const td = db
    .insert(schema.takedowns)
    .values({
      userId: u.id,
      talentId,
      reason,
      status: "pending",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();

  notifyAdmins(
    "takedown_requested",
    "takedowns",
    td.id,
    "新下架申请",
    `${t.stageName} · ${reason.slice(0, 40)}`
  );

  redirect(`/creator/talents/${talentId}?ok=takedown`);
}

export async function reviewTakedown(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/takedowns");

  const id = Number(formData.get("id"));
  const action = String(formData.get("action") || "");
  const td = db.select().from(schema.takedowns).where(eq(schema.takedowns.id, id)).get();
  if (!td) redirect("/admin/takedowns");
  const now = Math.floor(Date.now() / 1000);

  if (action === "approve") {
    const t = db.select().from(schema.talents).where(eq(schema.talents.id, td.talentId)).get();
    const rec = mintRecord("takedowns", td.id, {
      talentSnapshot: t,
      reason: td.reason,
      approvedAt: now,
    });
    db.update(schema.talents)
      .set({ status: "taken_down" })
      .where(eq(schema.talents.id, td.talentId))
      .run();
    db.update(schema.takedowns)
      .set({ status: "approved", resolvedAt: now, chainRecordId: rec.id })
      .where(eq(schema.takedowns.id, id))
      .run();
  } else if (action === "reject") {
    db.update(schema.takedowns)
      .set({ status: "rejected", resolvedAt: now })
      .where(eq(schema.takedowns.id, id))
      .run();
  }

  notifyUser(
    td.userId,
    "takedown_decision",
    "takedowns",
    td.id,
    action === "approve" ? "下架申请通过" : "下架申请被驳回",
    action === "approve"
      ? "形象已下架,所有新订单授权停止。"
      : "未达到下架条件,如有疑问请联系平台。"
  );

  logAction(
    u,
    action === "approve" ? "takedown_approved" : "takedown_rejected",
    "takedowns",
    td.id,
    td,
    { ...td, status: action === "approve" ? "approved" : "rejected" },
    `下架申请 #${td.id}`
  );

  redirect("/admin/takedowns");
}
