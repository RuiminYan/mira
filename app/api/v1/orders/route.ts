import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, paginate, requireScope } from "@/lib/apiRoute";
import { createOrderCore } from "@/lib/orderCore";
import { isBanned } from "@/lib/risk";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "orders:read");
  if (gate) return gate;
  const { limit, offset, url } = paginate(req);
  const status = url.searchParams.get("status");
  const user = db.select().from(schema.users).where(eq(schema.users.id, ctx.userId)).get();
  if (!user) return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });

  let cond;
  if (user.role === "partner") {
    cond = eq(schema.orders.partnerId, ctx.userId);
  } else if (user.role === "creator") {
    const tIds = db
      .select({ id: schema.talents.id })
      .from(schema.talents)
      .where(eq(schema.talents.creatorId, ctx.userId))
      .all()
      .map((r) => r.id);
    if (tIds.length === 0) return jsonOk([]);
    cond = inArray(schema.orders.talentId, tIds);
  } else {
    // admin/mcn: no filter
    cond = undefined;
  }
  const statusCond =
    status && ["pending", "paid", "approved", "delivered", "settled", "disputed", "refunded", "cancelled"].includes(status)
      ? eq(schema.orders.status, status as "pending")
      : null;
  const finalWhere = cond && statusCond ? and(cond, statusCond) : cond ?? statusCond;
  const q = db
    .select()
    .from(schema.orders)
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit)
    .offset(offset);
  const rows = finalWhere ? q.where(finalWhere).all() : q.all();
  return jsonOk(rows.map(serializeOrder));
}

export async function POST(req: NextRequest) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "orders:write");
  if (gate) return gate;
  const user = db.select().from(schema.users).where(eq(schema.users.id, ctx.userId)).get();
  if (!user) return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
  if (user.role !== "partner" && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "role", message: "仅制作方可下单" }, { status: 403 });
  }
  if (isBanned(user.id)) {
    return NextResponse.json({ ok: false, error: "banned", message: "账号已封禁" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_json", message: "请求体不是合法 JSON" }, { status: 400 });
  }
  const talentId = Number(body.talentId);
  const projectName = String(body.projectName || "").trim();
  const packType = body.packType ? String(body.packType).trim() : undefined;
  const scope = String(body.scope || (packType ? `${packType} 授权` : "")).trim();
  const durationDays = body.durationDays != null ? Number(body.durationDays) : undefined;
  const exclusive = !!body.exclusive;
  const amount = body.amount != null ? Number(body.amount) : undefined;

  if (!talentId || !projectName || !packType) {
    return NextResponse.json(
      { ok: false, error: "fields", message: "talentId / projectName / packType 必填" },
      { status: 400 }
    );
  }

  const r = createOrderCore({
    partnerId: ctx.userId,
    talentId,
    projectName,
    scope,
    packType,
    durationDays,
    exclusive,
    amount,
  });

  if (!r.ok) {
    const httpCode =
      r.code === "talent_not_found"
        ? 404
        : r.code === "amount" || r.code === "fields"
          ? 400
          : r.code === "role" || r.code === "banned" || r.code === "taken_down"
            ? 403
            : 400;
    return NextResponse.json({ ok: false, error: r.code, message: r.message }, { status: httpCode });
  }
  return NextResponse.json({ ok: true, data: serializeOrder(r.order) }, { status: 201 });
}

function serializeOrder(o: typeof schema.orders.$inferSelect) {
  return {
    id: o.id,
    partnerId: o.partnerId,
    talentId: o.talentId,
    projectName: o.projectName,
    scope: o.scope,
    amount: o.amount,
    share: o.share,
    status: o.status,
    createdAt: o.createdAt,
  };
}
