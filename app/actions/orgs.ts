"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { logAction } from "@/lib/audit";

export async function createOrganization(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || (u.role !== "partner" && u.role !== "admin")) redirect("/login?role=partner&next=/partner/org/new");
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const kind = String(formData.get("kind") || "studio") as "studio" | "mcn" | "brand" | "agency";
  const description = String(formData.get("description") || "").trim().slice(0, 300);
  if (!name) redirect("/partner/org/new?err=name");
  const now = Math.floor(Date.now() / 1000);
  const o = db
    .insert(schema.organizations)
    .values({ name, kind, description, createdAt: now })
    .returning()
    .get();
  db.insert(schema.orgMembers)
    .values({
      orgId: o.id,
      userId: u.id,
      role: "owner",
      invitedBy: null,
      joinedAt: now,
    })
    .run();
  logAction(u, "org_created", "organizations", o.id, null, o, `创建团队 ${name}`);
  redirect(`/partner/org/${o.id}`);
}

export async function inviteOrgMember(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const orgId = Number(formData.get("orgId"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email.includes("@")) redirect(`/partner/org/${orgId}?err=email`);
  const owner = db
    .select()
    .from(schema.orgMembers)
    .where(
      and(
        eq(schema.orgMembers.orgId, orgId),
        eq(schema.orgMembers.userId, u.id),
        eq(schema.orgMembers.role, "owner")
      )
    )
    .get();
  if (!owner && u.role !== "admin") redirect(`/partner/org/${orgId}?err=role`);

  let invitee = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!invitee) {
    invitee = db
      .insert(schema.users)
      .values({
        email,
        nickname: email.split("@")[0]!,
        role: "partner",
        createdAt: Math.floor(Date.now() / 1000),
      })
      .returning()
      .get();
  }
  const dup = db
    .select()
    .from(schema.orgMembers)
    .where(and(eq(schema.orgMembers.orgId, orgId), eq(schema.orgMembers.userId, invitee.id)))
    .get();
  if (dup) redirect(`/partner/org/${orgId}?ok=already`);
  db.insert(schema.orgMembers)
    .values({
      orgId,
      userId: invitee.id,
      role: "member",
      invitedBy: u.id,
      joinedAt: Math.floor(Date.now() / 1000),
    })
    .run();
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId)).get();
  notifyUser(invitee.id, "org_invite", "organizations", orgId, "你被加入团队", `团队「${org?.name ?? ""}」邀请你加入`);
  redirect(`/partner/org/${orgId}?ok=invite`);
}

export async function assignCsm(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/csm");
  const subjectKind = String(formData.get("subjectKind") || "org") as "org" | "user";
  const subjectId = Number(formData.get("subjectId") || 0);
  const csmId = Number(formData.get("csmId") || 0);
  const note = String(formData.get("note") || "").trim().slice(0, 200);
  if (!csmId || !subjectId) redirect("/admin/csm?err=fields");
  const now = Math.floor(Date.now() / 1000);
  db.insert(schema.csmAssignments)
    .values({
      subjectKind,
      orgId: subjectKind === "org" ? subjectId : null,
      userId: subjectKind === "user" ? subjectId : null,
      csmId,
      note,
      startedAt: now,
    })
    .run();
  if (subjectKind === "user") {
    notifyUser(subjectId, "csm_assigned", "users", subjectId, "已分配客户成功经理", "请通过工作台联系你的对接人");
  } else {
    const members = db
      .select()
      .from(schema.orgMembers)
      .where(eq(schema.orgMembers.orgId, subjectId))
      .all();
    for (const m of members) {
      notifyUser(m.userId, "csm_assigned", "organizations", subjectId, "已分配客户成功经理", "团队已绑定客户成功经理");
    }
  }
  logAction(u, "csm_assigned", "csm_assignments", null, null, { subjectKind, subjectId, csmId }, `CSM 分配`);
  redirect("/admin/csm?ok=1");
}
