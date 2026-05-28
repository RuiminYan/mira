"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { sha256, mintRecord } from "@/lib/chain";
import { computeContractSha, contractTitle } from "@/lib/contract";
import { notifyUser } from "@/lib/notify";
import { logAction } from "@/lib/audit";
import { recordActivity, activityForVerificationApproved } from "@/lib/activity";
import { checkMultiAccount } from "@/lib/risk";
import { fireWebhook } from "@/lib/webhooks";
import { maybeAutoGrant } from "@/lib/badges";
import { triggerOn } from "@/lib/achievements";

export async function submitVerification(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/verify");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const realName = String(formData.get("realName") || "").trim();
  const idCard = String(formData.get("idCard") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (realName.length < 2 || realName.length > 30) redirect("/creator/verify?err=name");
  if (!/^\d{15}$|^\d{17}[\dXx]$/.test(idCard)) redirect("/creator/verify?err=idcard");
  if (!/^\d{11}$/.test(phone)) redirect("/creator/verify?err=phone");

  const hash = sha256(idCard.toUpperCase());
  const last4 = idCard.slice(-4);

  const existing = db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.userId, u.id))
    .get();

  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    db.update(schema.verifications)
      .set({
        realName,
        idCardHashSHA256: hash,
        idCardLast4: last4,
        phone,
        status: "submitted",
        reason: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
      })
      .where(eq(schema.verifications.id, existing.id))
      .run();
  } else {
    db.insert(schema.verifications)
      .values({
        userId: u.id,
        realName,
        idCardHashSHA256: hash,
        idCardLast4: last4,
        phone,
        status: "submitted",
        createdAt: now,
      })
      .run();
  }

  // risk: detect same id-card across multiple accounts
  checkMultiAccount(u.id, hash);

  redirect("/creator/verify?ok=1");
}

export async function reviewVerification(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/verifications");

  const id = Number(formData.get("id"));
  const action = String(formData.get("action") || "");
  const reason = String(formData.get("reason") || "").trim();

  const v = db.select().from(schema.verifications).where(eq(schema.verifications.id, id)).get();
  if (!v) redirect("/admin/verifications");

  const now = Math.floor(Date.now() / 1000);

  if (action === "approve") {
    db.update(schema.verifications)
      .set({ status: "approved", reviewedBy: u.id, reviewedAt: now, reason: null })
      .where(eq(schema.verifications.id, id))
      .run();

    db.update(schema.users).set({ verified: 1 }).where(eq(schema.users.id, v.userId)).run();

    const target = db.select().from(schema.users).where(eq(schema.users.id, v.userId)).get();
    if (target) {
      const signedAt = now;
      const draft = {
        kind: "kyc_license" as const,
        partyAName: "Mira 镜界平台",
        partyBName: v.realName,
        scope: "AI 肖像基础授权与平台代理发行",
        amount: 0,
        share: 0,
        bodyHTMLPayload: {
          userId: v.userId,
          last4: v.idCardLast4,
          phone: v.phone,
        },
      };
      const sha = computeContractSha(draft, signedAt);
      const c = db
        .insert(schema.contracts)
        .values({
          orderId: null,
          kind: "kyc_license",
          userId: v.userId,
          talentId: null,
          partyAName: draft.partyAName,
          partyBName: draft.partyBName,
          scope: draft.scope,
          amount: 0,
          share: 0,
          signedAt,
          sha256: sha,
          createdAt: now,
        })
        .returning()
        .get();

      mintRecord("contracts", c.id, {
        kind: "kyc_license",
        title: contractTitle("kyc_license"),
        partyA: draft.partyAName,
        partyB: draft.partyBName,
        sha256: sha,
        signedAt,
      });

      mintRecord("verifications", v.id, {
        userId: v.userId,
        nickname: target.nickname,
        last4: v.idCardLast4,
        approvedAt: now,
      });

      notifyUser(
        v.userId,
        "verification_approved",
        "verifications",
        v.id,
        "实名认证通过",
        `KYC 已完成,基础授权合同已自动签订并上链。`
      );

      recordActivity(
        "verification_approved",
        v.userId,
        "verifications",
        v.id,
        activityForVerificationApproved({ nickname: target.nickname })
      );
      logAction(u, "verification_approved", "verifications", v.id, v, { ...v, status: "approved" }, `${target.nickname} 实名通过`);

      fireWebhook(v.userId, "verification.approved", {
        userId: v.userId,
        nickname: target.nickname,
        approvedAt: now,
      });
      triggerOn("verified", v.userId);
      maybeAutoGrant(v.userId);
    }
  } else if (action === "reject") {
    db.update(schema.verifications)
      .set({
        status: "rejected",
        reviewedBy: u.id,
        reviewedAt: now,
        reason: reason || "材料不完整,请重新提交。",
      })
      .where(eq(schema.verifications.id, id))
      .run();

    notifyUser(
      v.userId,
      "verification_rejected",
      "verifications",
      v.id,
      "实名认证未通过",
      reason || "材料不完整,请重新提交。"
    );

    logAction(u, "verification_rejected", "verifications", v.id, v, { ...v, status: "rejected", reason }, `${reason || "未通过"}`);
  }

  redirect("/admin/verifications");
}
