"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { logAction } from "@/lib/audit";

export async function inviteCreatorToMCN(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=mcn&next=/mcn/creators/invite");
  if (u.role !== "mcn" && u.role !== "admin") redirect("/");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const commission = Math.max(0, Math.min(50, Number(formData.get("commissionPct") || 15)));
  if (!email) redirect("/mcn/creators/invite?err=email");

  const target = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!target) redirect("/mcn/creators/invite?err=notfound");
  if (target.role !== "creator") redirect("/mcn/creators/invite?err=role");

  // de-dup: existing pending or active
  const existing = db
    .select()
    .from(schema.mcnCreators)
    .where(
      and(
        eq(schema.mcnCreators.mcnId, u.id),
        eq(schema.mcnCreators.creatorId, target.id)
      )
    )
    .get();
  if (existing && (existing.status === "pending" || existing.status === "active")) {
    redirect("/mcn/creators?err=dup");
  }

  const token = crypto.randomBytes(16).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const r = db
    .insert(schema.mcnCreators)
    .values({
      mcnId: u.id,
      creatorId: target.id,
      commissionPct: commission,
      status: "pending",
      inviteToken: token,
      createdAt: now,
    })
    .returning()
    .get();

  notifyUser(
    target.id,
    "mcn_invite",
    "mcn_creators",
    r.id,
    "MCN 签约邀请",
    `${u.nickname} 邀请你以 ${commission}% 抽成合作`
  );
  logAction(u, "mcn_invite_sent", "mcn_creators", r.id, null, r, `邀请 ${target.nickname}(${commission}%)`);

  redirect("/mcn/creators?ok=invited");
}

export async function respondMCNInvite(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/mcn");

  const id = Number(formData.get("id"));
  const action = String(formData.get("action") || "");
  const inv = db.select().from(schema.mcnCreators).where(eq(schema.mcnCreators.id, id)).get();
  if (!inv) redirect("/creator/mcn");
  if (inv.creatorId !== u.id) redirect("/creator/mcn");
  if (inv.status !== "pending") redirect("/creator/mcn");

  const now = Math.floor(Date.now() / 1000);
  if (action === "accept") {
    db.update(schema.mcnCreators)
      .set({ status: "active", respondedAt: now })
      .where(eq(schema.mcnCreators.id, id))
      .run();
    notifyUser(
      inv.mcnId,
      "mcn_invite_response",
      "mcn_creators",
      id,
      "MCN 邀请已接受",
      `${u.nickname} 接受了你的签约邀请`
    );
    logAction(u, "mcn_invite_accepted", "mcn_creators", id, inv, { ...inv, status: "active" }, "");
  } else if (action === "reject") {
    db.update(schema.mcnCreators)
      .set({ status: "rejected", respondedAt: now })
      .where(eq(schema.mcnCreators.id, id))
      .run();
    notifyUser(
      inv.mcnId,
      "mcn_invite_response",
      "mcn_creators",
      id,
      "MCN 邀请被拒绝",
      `${u.nickname} 拒绝了你的签约邀请`
    );
    logAction(u, "mcn_invite_rejected", "mcn_creators", id, inv, { ...inv, status: "rejected" }, "");
  }

  redirect("/creator/mcn?ok=1");
}

export async function pauseMCNCreator(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || (u.role !== "mcn" && u.role !== "admin")) redirect("/");
  const id = Number(formData.get("id"));
  const inv = db.select().from(schema.mcnCreators).where(eq(schema.mcnCreators.id, id)).get();
  if (!inv) redirect("/mcn/creators");
  if (inv.mcnId !== u.id && u.role !== "admin") redirect("/mcn/creators");
  const next = inv.status === "active" ? "paused" : "active";
  db.update(schema.mcnCreators)
    .set({ status: next })
    .where(eq(schema.mcnCreators.id, id))
    .run();
  logAction(
    u,
    next === "paused" ? "mcn_creator_paused" : "mcn_creator_resumed",
    "mcn_creators",
    id,
    inv,
    { ...inv, status: next },
    ""
  );
  redirect("/mcn/creators");
}
