import crypto from "node:crypto";
import { db, schema } from "@/db";
import type { Order, Talent, User } from "@/db/schema";
import { mintRecord } from "@/lib/chain";

export function computeFingerprint(
  orderId: number,
  talentId: number,
  partnerId: number,
  ts: number
): string {
  return crypto
    .createHash("sha256")
    .update(`${orderId}|${talentId}|${partnerId}|${ts}`)
    .digest("hex");
}

export function generateDeliveryPack(
  order: Order,
  talent: Talent,
  partner: User
): { uploadId: number; chainId: number; fingerprint: string; url: string; ts: number } {
  const ts = Math.floor(Date.now() / 1000);
  const fingerprint = computeFingerprint(order.id, talent.id, partner.id, ts);
  const url = `/uploads/pack/${order.id}.json`;

  const upload = db
    .insert(schema.uploads)
    .values({
      userId: partner.id,
      talentId: talent.id,
      kind: "delivery_pack",
      url,
      sizeBytes: 0,
      mimeType: "application/json",
      sha256: fingerprint,
      createdAt: ts,
    })
    .returning()
    .get();

  const chain = mintRecord("orders", order.id, {
    event: "delivered_pack",
    orderId: order.id,
    talentId: talent.id,
    talentName: talent.stageName,
    partnerId: partner.id,
    partnerName: partner.nickname,
    projectName: order.projectName,
    fingerprint,
    packUrl: url,
    deliveredAt: ts,
  });

  return { uploadId: upload.id, chainId: chain.id, fingerprint, url, ts };
}
