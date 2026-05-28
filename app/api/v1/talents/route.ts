import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, paginate, requireScope } from "@/lib/apiRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "talents:read");
  if (gate) return gate;
  const { limit, offset, url } = paginate(req);
  const status = url.searchParams.get("status");
  const tag = url.searchParams.get("tag");

  const cond = [];
  if (status === "live" || status === "draft" || status === "review" || status === "taken_down") {
    cond.push(eq(schema.talents.status, status));
  }
  if (tag) cond.push(like(schema.talents.styleTags, `%${tag.replace(/[%_]/g, "")}%`));

  const where = cond.length === 0 ? undefined : cond.length === 1 ? cond[0] : and(...cond);
  const q = db
    .select()
    .from(schema.talents)
    .orderBy(desc(schema.talents.createdAt))
    .limit(limit)
    .offset(offset);
  const rows = where ? q.where(where).all() : q.all();
  return jsonOk(
    rows.map((t) => ({
      id: t.id,
      creatorId: t.creatorId,
      stageName: t.stageName,
      gender: t.gender,
      ageBand: t.ageBand,
      styleTags: t.styleTags.split(/[,，、]+/).map((s) => s.trim()).filter(Boolean),
      grade: t.grade,
      priceOnce: t.priceOnce,
      revenueShare: t.revenueShare,
      exclusive: !!t.exclusive,
      followers: t.followers,
      status: t.status,
      createdAt: t.createdAt,
    }))
  );
}
