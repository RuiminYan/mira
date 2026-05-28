import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authFromReq, jsonOk, requireScope } from "@/lib/apiRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = authFromReq(req);
  if (ctx instanceof NextResponse) return ctx;
  const gate = requireScope(ctx, "webhooks:read");
  if (gate) return gate;
  const rows = db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.userId, ctx.userId))
    .orderBy(desc(schema.webhooks.createdAt))
    .all();
  return jsonOk(
    rows.map((w) => ({
      id: w.id,
      url: w.url,
      events: safeParse(w.event),
      status: w.status,
      failCount: w.failCount,
      lastDeliveredAt: w.lastDeliveredAt,
      createdAt: w.createdAt,
    }))
  );
}

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
