import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, requireScope } from "@/lib/apiRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "talents:read");
  if (gate) return gate;
  const p = await params;
  const id = Number(p.id);
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  const t = db.select().from(schema.talents).where(eq(schema.talents.id, id)).get();
  if (!t) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const creator = db.select().from(schema.users).where(eq(schema.users.id, t.creatorId)).get();
  return jsonOk({
    id: t.id,
    creatorId: t.creatorId,
    creatorNickname: creator?.nickname ?? null,
    stageName: t.stageName,
    gender: t.gender,
    ageBand: t.ageBand,
    styleTags: t.styleTags.split(/[,，、]+/).map((s) => s.trim()).filter(Boolean),
    bio: t.bio,
    followers: t.followers,
    grade: t.grade,
    priceOnce: t.priceOnce,
    revenueShare: t.revenueShare,
    exclusive: !!t.exclusive,
    status: t.status,
    createdAt: t.createdAt,
  });
}
