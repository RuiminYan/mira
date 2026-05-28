"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { mintRecord } from "@/lib/chain";
import { computeContractSha, contractTitle } from "@/lib/contract";
import { notifyUser, notifyAdmins, notifyOrderState, ensureThread } from "@/lib/notify";
import { generateDeliveryPack } from "@/lib/watermark";
import { logAction } from "@/lib/audit";
import { recordActivity, activityForOrderSettled } from "@/lib/activity";
import { credit, debit } from "@/lib/wallet";
import { evaluateCoupon, redeemCoupon } from "@/lib/coupon";
import { checkHighAmount, checkRapidOrders, isBanned } from "@/lib/risk";
import { maybeFireReferralReward } from "@/lib/referral";
import { fireWebhook } from "@/lib/webhooks";
import { maybeAutoGrant } from "@/lib/badges";
import { bumpAchievement } from "@/lib/achievements";
import { triggerOn } from "@/lib/achievements";
import { createOrderCore } from "@/lib/orderCore";

type OrderStatus =
  | "pending"
  | "paid"
  | "approved"
  | "delivered"
  | "settled"
  | "disputed"
  | "refunded"
  | "cancelled";

const WITHHOLDING_RATE = 0.2;

export async function placeOrder(formData: FormData) {
  const talentId = Number(formData.get("talentId"));
  const u = await getCurrentUser();
  if (!u) {
    redirect(`/login?role=partner&next=/marketplace/${talentId}`);
  }
  if (u.role !== "partner" && u.role !== "admin") {
    redirect(`/marketplace/${talentId}?err=role`);
  }

  const projectName = String(formData.get("projectName") || "").trim();
  const scope = String(formData.get("scope") || "").trim();

  if (!talentId || !projectName || !scope) {
    redirect(`/marketplace/${talentId}?err=fields`);
  }

  if (isBanned(u.id)) redirect(`/marketplace/${talentId}?err=banned`);

  const r = createOrderCore({
    partnerId: u.id,
    talentId,
    projectName,
    scope,
  });

  if (!r.ok) {
    redirect(`/marketplace/${talentId}?err=${encodeURIComponent(r.code)}`);
  }

  redirect(`/partner/orders/${r.orderId}/pay`);
}

export async function payOrder(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const orderId = Number(formData.get("orderId"));
  const channel = (String(formData.get("channel") || "wechat") as "wechat" | "alipay" | "balance");
  const couponCode = String(formData.get("coupon") || "").trim();

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) redirect("/partner/orders");
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");
  if (o.status !== "pending") redirect(`/partner/orders/${orderId}`);

  if (isBanned(u.id)) redirect(`/partner/orders/${orderId}/pay?err=banned`);

  // evaluate coupon (order.amount is in yuan, convert to fen for evaluator that expects fen — pass yuan directly here since the rest of the system uses yuan-as-int. We'll treat amount as the unit it's stored in.)
  // NOTE: orders.amount is stored in yuan as int in legacy seed. Coupon discount math will operate in the same unit.
  let discount = 0;
  let couponId: number | null = null;
  if (couponCode) {
    const r = evaluateCoupon(couponCode, o.amount, "talent", o.talentId);
    if (r.ok) {
      discount = r.discountAmount;
      couponId = r.coupon.id;
    } else {
      redirect(`/partner/orders/${orderId}/pay?err=coupon`);
    }
  }
  const finalAmount = Math.max(0, o.amount - discount);

  if (channel === "balance") {
    // wallet stores in fen; convert finalAmount (yuan) → fen
    const fen = finalAmount * 100;
    const d = debit(u.id, fen, "order_pay", "orders", o.id, `订单 #${o.id} 支付`);
    if (!d.ok) redirect(`/partner/orders/${orderId}/pay?err=balance`);
  }

  const now = Math.floor(Date.now() / 1000);
  const tradeNo = "MIRA" + now + crypto.randomBytes(3).toString("hex").toUpperCase();
  const buyerNo = (channel === "wechat" ? "WX" : channel === "alipay" ? "ALI" : "BAL") + crypto.randomBytes(4).toString("hex").toUpperCase();

  db.insert(schema.payments)
    .values({
      orderId: o.id,
      amount: finalAmount,
      channel,
      status: "succeeded",
      mockTradeNo: tradeNo,
      mockBuyerNo: buyerNo,
      couponId,
      discountAmount: discount,
      paidAt: now,
      createdAt: now,
    })
    .run();

  if (couponId) {
    redeemCoupon(couponId, u.id, o.id, discount);
  }

  db.update(schema.orders).set({ status: "paid" }).where(eq(schema.orders.id, orderId)).run();

  mintRecord("orders", o.id, {
    event: "paid",
    tradeNo,
    channel,
    amount: o.amount,
    paidAt: now,
  });

  notifyOrderState(o.id, "paid");

  logAction(u, "order_paid", "orders", o.id, { status: "pending" }, { status: "paid", tradeNo, channel }, `订单 #${o.id} 已支付`);

  // Webhook: fire to both partner and creator subscribers
  const tFire = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  const payload = {
    orderId: o.id,
    projectName: o.projectName,
    amount: finalAmount,
    discount,
    channel,
    paidAt: now,
  };
  fireWebhook(o.partnerId, "order.paid", payload);
  if (tFire) fireWebhook(tFire.creatorId, "order.paid", payload);
  bumpAchievement(o.partnerId, "first_order", 1);
  maybeAutoGrant(o.partnerId);
  if (tFire) maybeAutoGrant(tFire.creatorId);

  redirect(`/partner/orders/${orderId}?paid=1`);
}

export async function updateOrderStatus(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin");

  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status")) as OrderStatus;

  const allowed: OrderStatus[] = [
    "pending",
    "paid",
    "approved",
    "delivered",
    "settled",
    "disputed",
    "refunded",
    "cancelled",
  ];
  if (!allowed.includes(status)) redirect("/admin");

  const before = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  db.update(schema.orders).set({ status }).where(eq(schema.orders.id, orderId)).run();

  // delivery pack on delivered
  if (status === "delivered") {
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    if (o && !o.deliveryPackId) {
      const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
      const partner = db.select().from(schema.users).where(eq(schema.users.id, o.partnerId)).get();
      if (t && partner) {
        const pack = generateDeliveryPack(o, t, partner);
        db.update(schema.orders)
          .set({ deliveryPackId: pack.uploadId })
          .where(eq(schema.orders.id, o.id))
          .run();
      }
      // auto-create distributions for 4 channels (queued)
      const channels: ("hongguo" | "douyin" | "kuaishou" | "videoaccount")[] = [
        "hongguo",
        "douyin",
        "kuaishou",
        "videoaccount",
      ];
      const existed = db
        .select()
        .from(schema.distributions)
        .where(eq(schema.distributions.orderId, orderId))
        .all();
      const have = new Set(existed.map((x) => x.channel));
      const nowTs = Math.floor(Date.now() / 1000);
      for (const c of channels) {
        if (have.has(c)) continue;
        db.insert(schema.distributions)
          .values({
            orderId,
            channel: c,
            status: "queued",
            payload: JSON.stringify({
              projectName: o.projectName,
              scope: o.scope,
              talentId: o.talentId,
            }),
            createdAt: nowTs,
          })
          .run();
      }
    }
  }

  if (status === "settled") {
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    if (o) {
      const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
      if (t) {
        const exists = db
          .select()
          .from(schema.revenues)
          .where(eq(schema.revenues.orderId, o.id))
          .all()
          .filter((r) => r.kind === "share");
        const now = Math.floor(Date.now() / 1000);
        if (exists.length === 0) {
          const shareAmount = Math.floor((o.amount * o.share) / 100);
          const withholding = Math.floor(shareAmount * WITHHOLDING_RATE);
          db.insert(schema.revenues)
            .values({
              orderId: o.id,
              creatorId: t.creatorId,
              amount: shareAmount,
              kind: "share",
              note: `分账 ${o.share}% · ${o.projectName}`,
              createdAt: now,
            })
            .run();
          db.insert(schema.revenues)
            .values({
              orderId: o.id,
              creatorId: t.creatorId,
              amount: -withholding,
              kind: "withholding",
              note: `个税代扣 20% · ${o.projectName}`,
              createdAt: now,
            })
            .run();

          mintRecord("orders", o.id, {
            event: "settled",
            shareAmount,
            withholding,
            settledAt: now,
          });

          // wallet credit for creator (shareAmount - withholding) in fen
          const netFen = Math.max(0, (shareAmount - withholding) * 100);
          if (netFen > 0) {
            credit(
              t.creatorId,
              netFen,
              "revenue_in",
              "orders",
              o.id,
              `订单 #${o.id} 分账入账`
            );
          }

          // referral reward (if partner was invited and this is their first settled)
          maybeFireReferralReward(o.partnerId, o.id);
        }
        const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
        recordActivity(
          "order_settled",
          t.creatorId,
          "orders",
          o.id,
          activityForOrderSettled({
            creatorNickname: creator?.nickname ?? t.stageName,
            talentName: t.stageName,
            projectName: o.projectName,
            amount: o.amount,
          })
        );
      }
    }
  }

  const after = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  logAction(
    u,
    status === "settled" ? "order_settled" : "order_status_updated",
    "orders",
    orderId,
    before,
    after,
    `订单 #${orderId} → ${status}`
  );

  notifyOrderState(orderId, status);

  // Webhook: settled / refunded
  if (status === "settled" || status === "refunded") {
    const o = after;
    if (o) {
      const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
      const payload = {
        orderId: o.id,
        projectName: o.projectName,
        amount: o.amount,
        share: o.share,
        status,
      };
      const evt = status === "settled" ? "order.settled" : "order.refunded";
      fireWebhook(o.partnerId, evt, payload);
      if (t) {
        fireWebhook(t.creatorId, evt, payload);
        if (status === "settled") {
          triggerOn("order_settled", t.creatorId, { amount: o.amount, orderId: o.id });
          maybeAutoGrant(t.creatorId);
        }
      }
    }
  }

  redirect("/admin");
}

export async function openDispute(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const orderId = Number(formData.get("orderId"));
  const kind = String(formData.get("kind") || "quality") as "quality" | "non_delivery" | "misuse";
  const description = String(formData.get("description") || "").trim();
  if (description.length < 5) redirect(`/partner/orders/${orderId}?err=desc`);

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) redirect("/partner/orders");
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");
  if (!["paid", "approved", "delivered"].includes(o.status)) redirect(`/partner/orders/${orderId}?err=status`);

  const now = Math.floor(Date.now() / 1000);
  db.insert(schema.disputes)
    .values({
      orderId,
      partnerId: o.partnerId,
      talentId: o.talentId,
      kind,
      description,
      status: "submitted",
      createdAt: now,
    })
    .run();
  db.update(schema.orders).set({ status: "disputed" }).where(eq(schema.orders.id, orderId)).run();

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  if (t) {
    notifyUser(
      t.creatorId,
      "dispute_opened",
      "orders",
      o.id,
      "订单出现争议",
      `${o.projectName} · 类型 ${kind}`
    );
  }
  notifyAdmins(
    "dispute_opened",
    "orders",
    o.id,
    "新争议待仲裁",
    `${o.projectName} · 类型 ${kind}`
  );

  redirect(`/partner/orders/${orderId}?ok=dispute`);
}

export async function resolveDispute(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/disputes");
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision") || "");
  const note = String(formData.get("note") || "").trim();
  const refundAmount = Number(formData.get("refundAmount") || 0);

  const d = db.select().from(schema.disputes).where(eq(schema.disputes.id, id)).get();
  if (!d) redirect("/admin/disputes");
  const now = Math.floor(Date.now() / 1000);

  if (decision === "upheld_creator") {
    db.update(schema.disputes)
      .set({
        status: "upheld_creator",
        decisionNote: note,
        arbitratorId: u.id,
        resolvedAt: now,
      })
      .where(eq(schema.disputes.id, id))
      .run();
    db.update(schema.orders).set({ status: "approved" }).where(eq(schema.orders.id, d.orderId)).run();
  } else if (decision === "upheld_partner") {
    const refund = Math.max(0, Math.floor(refundAmount));
    db.update(schema.disputes)
      .set({
        status: "upheld_partner",
        decisionNote: note,
        refundAmount: refund,
        arbitratorId: u.id,
        resolvedAt: now,
      })
      .where(eq(schema.disputes.id, id))
      .run();

    const o = db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId)).get();
    if (o) {
      const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
      if (t) {
        const tradeNo = "REFUND" + now + crypto.randomBytes(3).toString("hex").toUpperCase();
        db.insert(schema.payments)
          .values({
            orderId: o.id,
            amount: refund,
            channel: "wechat",
            status: "refunded",
            mockTradeNo: tradeNo,
            mockBuyerNo: "REFUND",
            paidAt: now,
            createdAt: now,
          })
          .run();
        db.insert(schema.revenues)
          .values({
            orderId: o.id,
            creatorId: t.creatorId,
            amount: -refund,
            kind: "refund",
            note: `退款抵扣 · ${o.projectName}`,
            createdAt: now,
          })
          .run();
        // wallet refund to partner in fen
        if (refund > 0) {
          credit(o.partnerId, refund * 100, "refund_in", "orders", o.id, `订单 #${o.id} 退款`);
        }
      }
      db.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, d.orderId)).run();
    }
  } else {
    db.update(schema.disputes)
      .set({ status: "closed", decisionNote: note, arbitratorId: u.id, resolvedAt: now })
      .where(eq(schema.disputes.id, id))
      .run();
  }

  const o2 = db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId)).get();
  if (o2) {
    const t = db.select().from(schema.talents).where(eq(schema.talents.id, o2.talentId)).get();
    notifyUser(
      o2.partnerId,
      "dispute_resolved",
      "orders",
      o2.id,
      "争议已仲裁",
      `${o2.projectName} · ${decision === "upheld_creator" ? "支持创作者" : decision === "upheld_partner" ? "支持制作方" : "已关闭"}`
    );
    if (t) {
      notifyUser(
        t.creatorId,
        "dispute_resolved",
        "orders",
        o2.id,
        "争议已仲裁",
        `${o2.projectName} · ${decision === "upheld_creator" ? "支持创作者" : decision === "upheld_partner" ? "支持制作方" : "已关闭"}`
      );
    }
  }

  const afterD = db.select().from(schema.disputes).where(eq(schema.disputes.id, id)).get();
  logAction(u, "dispute_resolved", "disputes", id, d, afterD, `仲裁结果 ${decision}`);

  redirect("/admin/disputes");
}

export async function requestInvoice(formData: FormData) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const orderId = Number(formData.get("orderId"));
  const companyName = String(formData.get("companyName") || "").trim();
  const taxNumber = String(formData.get("taxNumber") || "").trim();
  const titleType = (String(formData.get("titleType") || "vat_general") as "vat_special" | "vat_general");

  if (!companyName || !/^[A-Za-z0-9]{15,20}$/.test(taxNumber)) {
    redirect(`/partner/orders/${orderId}?err=invoice`);
  }
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) redirect("/partner/orders");
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");

  const now = Math.floor(Date.now() / 1000);
  const newInv = db
    .insert(schema.invoices)
    .values({
      orderId,
      partnerId: o.partnerId,
      companyName,
      taxNumber,
      titleType,
      amount: o.amount,
      status: "requested",
      sha256: "",
      createdAt: now,
    })
    .returning()
    .get();

  notifyAdmins(
    "invoice_requested",
    "invoices",
    newInv.id,
    "新发票申请",
    `${companyName} · ¥${o.amount.toLocaleString()}`
  );

  redirect(`/partner/orders/${orderId}?ok=invoice`);
}

export async function issueInvoice(formData: FormData) {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") redirect("/login?role=admin&next=/admin/invoices");
  const id = Number(formData.get("id"));
  const inv = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get();
  if (!inv) redirect("/admin/invoices");

  const now = Math.floor(Date.now() / 1000);
  const invoiceNo = "MIRA-" + now + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
  const payload = {
    invoiceNo,
    orderId: inv.orderId,
    companyName: inv.companyName,
    taxNumber: inv.taxNumber,
    amount: inv.amount,
    titleType: inv.titleType,
    issuedAt: now,
  };
  const hash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  db.update(schema.invoices)
    .set({ status: "issued", invoiceNo, sha256: hash, issuedAt: now })
    .where(eq(schema.invoices.id, id))
    .run();

  mintRecord("invoices", id, payload);

  notifyUser(
    inv.partnerId,
    "invoice_issued",
    "invoices",
    id,
    "发票已开具",
    `${inv.companyName} · ¥${inv.amount.toLocaleString()} · ${invoiceNo}`
  );

  logAction(u, "invoice_issued", "invoices", id, inv, { ...inv, status: "issued", invoiceNo }, `发票 ${invoiceNo}`);

  redirect("/admin/invoices");
}
