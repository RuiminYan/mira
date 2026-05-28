import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, requireScope } from "@/lib/apiRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "me:read");
  if (gate) return gate;
  const u = db.select().from(schema.users).where(eq(schema.users.id, ctx.userId)).get();
  if (!u) return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
  return jsonOk({
    id: u.id,
    nickname: u.nickname,
    role: u.role,
    verified: !!u.verified,
    scope: ctx.scope,
  });
}
