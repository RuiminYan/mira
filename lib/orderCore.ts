import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { mintRecord } from "@/lib/chain";
import { computeContractSha } from "@/lib/contract";
import { ensureThread, notifyOrderState } from "@/lib/notify";
import { recordActivity } from "@/lib/activity";
import { checkHighAmount, checkRapidOrders } from "@/lib/risk";
import { triggerOn } from "@/lib/achievements";

export type CreateOrderInput = {
  partnerId: number;
  talentId: number;
  projectName: string;
  scope: string;
  packType?: string;
  durationDays?: number;
  exclusive?: boolean;
  amount?: number;
};

export type CreateOrderResult =
  | { ok: true; orderId: number; order: typeof schema.orders.$inferSelect }
  | { ok: false; code: string; message: string };

export function createOrderCore(input: CreateOrderInput): CreateOrderResult {
  const partner = db.select().from(schema.users).where(eq(schema.users.id, input.partnerId)).get();
  if (!partner) return { ok: false, code: "partner_not_found", message: "下单方不存在" };
  if (partner.banned) return { ok: false, code: "banned", message: "账号已封禁,无法下单" };
  if (partner.role !== "partner" && partner.role !== "admin") {
    return { ok: false, code: "role", message: "仅制作方可下单" };
  }

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, input.talentId)).get();
  if (!t) return { ok: false, code: "talent_not_found", message: "形象不存在" };
  if (t.status === "taken_down") return { ok: false, code: "taken_down", message: "形象已下架" };

  const projectName = (input.projectName || "").trim();
  const scope = (input.scope || "").trim();
  if (!projectName || !scope) {
    return { ok: false, code: "fields", message: "projectName 与 scope 必填" };
  }

  // 金额:显式 amount → 否则 talent.priceOnce;校验 100..1_000_000 元
  let amount =
    typeof input.amount === "number" && Number.isFinite(input.amount)
      ? Math.floor(input.amount)
      : t.priceOnce;
  if (input.exclusive === true) {
    amount = Math.floor(amount * 1.5);
  }
  if (amount < 100 || amount > 1_000_000) {
    return { ok: false, code: "amount", message: "amount 须在 100 至 1000000 之间" };
  }
  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
  const nowTs = Math.floor(Date.now() / 1000);

  const scopeFull = [
    input.packType ? `档位 ${input.packType}` : "",
    scope,
    input.durationDays ? `${input.durationDays} 天` : "",
    input.exclusive ? "独家档期" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const o = db
    .insert(schema.orders)
    .values({
      partnerId: input.partnerId,
      talentId: input.talentId,
      projectName,
      scope: scopeFull,
      amount,
      share: t.revenueShare,
      status: "pending",
      createdAt: nowTs,
    })
    .returning()
    .get();

  db.insert(schema.revenues)
    .values({
      orderId: o.id,
      creatorId: t.creatorId,
      amount,
      kind: "license",
      note: `授权费 · ${projectName}`,
      createdAt: nowTs,
    })
    .run();

  const draft = {
    kind: "order_license" as const,
    partyAName: partner.nickname ?? "制作方",
    partyBName: creator?.nickname ?? "创作者",
    scope: scopeFull,
    amount,
    share: t.revenueShare,
    bodyHTMLPayload: {
      orderId: o.id,
      talentName: t.stageName,
      projectName,
      packType: input.packType,
      durationDays: input.durationDays,
      exclusive: !!input.exclusive,
    },
  };
  const sha = computeContractSha(draft, nowTs);
  const c = db
    .insert(schema.contracts)
    .values({
      orderId: o.id,
      kind: "order_license",
      userId: t.creatorId,
      talentId: t.id,
      partyAName: draft.partyAName,
      partyBName: draft.partyBName,
      scope: draft.scope,
      amount: draft.amount,
      share: draft.share,
      signedAt: nowTs,
      sha256: sha,
      createdAt: nowTs,
    })
    .returning()
    .get();

  db.update(schema.orders).set({ contractId: c.id }).where(eq(schema.orders.id, o.id)).run();

  mintRecord("orders", o.id, {
    event: "created",
    contractId: c.id,
    sha256: sha,
    amount,
    share: t.revenueShare,
    createdAt: nowTs,
  });

  notifyOrderState(o.id, "pending");

  ensureThread(
    "order",
    "orders",
    o.id,
    `订单 · ${projectName}`,
    [
      { userId: input.partnerId, role: "partner" },
      { userId: t.creatorId, role: "creator" },
    ]
  );

  recordActivity(
    "talent_listed",
    input.partnerId,
    "orders",
    o.id,
    `${partner.nickname} 下单「${t.stageName}」· ${projectName}`
  );

  checkRapidOrders(input.partnerId, 5, 5);
  checkHighAmount(input.partnerId, o.id, amount, 10000);

  triggerOn("order_created", input.partnerId, { orderId: o.id, amount });

  return { ok: true, orderId: o.id, order: o };
}
