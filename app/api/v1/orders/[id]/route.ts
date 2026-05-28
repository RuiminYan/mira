import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, requireScope } from "@/lib/apiRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "orders:read");
  if (gate) return gate;
  const p = await params;
  const id = Number(p.id);
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  if (!o) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  const user = db.select().from(schema.users).where(eq(schema.users.id, ctx.userId)).get();
  if (user?.role === "partner" && o.partnerId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (user?.role === "creator" && t?.creatorId !== ctx.userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return jsonOk({
    id: o.id,
    partnerId: o.partnerId,
    talentId: o.talentId,
    talentName: t?.stageName ?? null,
    projectName: o.projectName,
    scope: o.scope,
    amount: o.amount,
    share: o.share,
    status: o.status,
    contractId: o.contractId,
    deliveryPackId: o.deliveryPackId,
    createdAt: o.createdAt,
  });
}
