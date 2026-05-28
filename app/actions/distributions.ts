"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { mintRecord } from "@/lib/chain";
import { logAction } from "@/lib/audit";
import { recordActivity, activityForDistributionLive } from "@/lib/activity";
import { notifyUser } from "@/lib/notify";

type Channel = "hongguo" | "douyin" | "kuaishou" | "videoaccount";

const CHANNEL_PREFIX: Record<Channel, string> = {
  hongguo: "RG",
  douyin: "DY",
  kuaishou: "KS",
  videoaccount: "VA",
};

function genExternalId(channel: Channel): string {
  const y = new Date().getFullYear();
  const n = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${CHANNEL_PREFIX[channel]}-${y}-${n}`;
}

function genPlayUrl(externalId: string): string {
  return `https://example.invalid/play/${externalId}`;
}

const REJECT_REASONS = [
  "审核未通过 · 缺少 AIGC 显著标识",
  "审核未通过 · 内容与渠道分级不符",
  "审核未通过 · 涉嫌重复推送",
];

export async function pushDistribution(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");

  const id = Number(formData.get("id"));
  const d = db.select().from(schema.distributions).where(eq(schema.distributions.id, id)).get();
  if (!d) redirect("/partner/orders");

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId)).get();
  if (!o) redirect("/partner/orders");
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");
  if (d.status === "live" || d.status === "pushed") {
    redirect(`/partner/orders/${o.id}?ok=already`);
  }

  const now = Math.floor(Date.now() / 1000);
  const isRejected = Math.random() < 0.3;

  if (isRejected) {
    const reason = REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)] ?? REJECT_REASONS[0]!;
    db.update(schema.distributions)
      .set({ status: "rejected", rejectReason: reason, pushedAt: now })
      .where(eq(schema.distributions.id, id))
      .run();
    logAction(u, "distribution_pushed", "distributions", id, d, { ...d, status: "rejected" }, reason);
    mintRecord("distributions", id, {
      event: "rejected",
      channel: d.channel,
      reason,
      at: now,
    });
    redirect(`/partner/orders/${o.id}?ok=rejected`);
  }

  const ext = genExternalId(d.channel as Channel);
  const play = genPlayUrl(ext);

  db.update(schema.distributions)
    .set({
      status: "pushed",
      externalRefId: ext,
      playUrl: play,
      pushedAt: now,
    })
    .where(eq(schema.distributions.id, id))
    .run();

  mintRecord("distributions", id, {
    event: "pushed",
    channel: d.channel,
    externalRefId: ext,
    playUrl: play,
    at: now,
  });
  logAction(u, "distribution_pushed", "distributions", id, d, { ...d, status: "pushed", externalRefId: ext }, `${d.channel} → ${ext}`);

  redirect(`/partner/orders/${o.id}?ok=pushed`);
}

export async function markDistributionLive(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/distributions");

  const id = Number(formData.get("id"));
  const d = db.select().from(schema.distributions).where(eq(schema.distributions.id, id)).get();
  if (!d) redirect("/admin/distributions");
  if (d.status !== "pushed") redirect("/admin/distributions");

  const now = Math.floor(Date.now() / 1000);
  db.update(schema.distributions)
    .set({ status: "live", publishedAt: now })
    .where(eq(schema.distributions.id, id))
    .run();

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId)).get();
  if (o) {
    const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
    if (t) {
      recordActivity(
        "distribution_live",
        t.creatorId,
        "distributions",
        d.id,
        activityForDistributionLive({
          talentName: t.stageName,
          channel: d.channel,
          projectName: o.projectName,
        })
      );
      notifyUser(
        t.creatorId,
        "distribution_live",
        "distributions",
        d.id,
        "渠道已上线",
        `${o.projectName} · ${d.channel}`
      );
    }
  }
  logAction(u, "distribution_published", "distributions", id, d, { ...d, status: "live" }, `${d.channel} 上线`);
  redirect("/admin/distributions");
}

export async function repushDistribution(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/distributions");
  const id = Number(formData.get("id"));
  const d = db.select().from(schema.distributions).where(eq(schema.distributions.id, id)).get();
  if (!d) redirect("/admin/distributions");
  const now = Math.floor(Date.now() / 1000);
  db.update(schema.distributions)
    .set({ status: "queued", rejectReason: null, pushedAt: null, externalRefId: null, playUrl: null })
    .where(eq(schema.distributions.id, id))
    .run();
  logAction(u, "distribution_pushed", "distributions", id, d, { ...d, status: "queued" }, "重新入队");
  void now;
  redirect("/admin/distributions");
}
