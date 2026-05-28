import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { sha256 } from "@/lib/chain";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const c = db.select().from(schema.contracts).where(eq(schema.contracts.id, id)).get();
  if (!c) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const chain = db
    .select()
    .from(schema.chainRecords)
    .where(eq(schema.chainRecords.refId, c.id))
    .orderBy(desc(schema.chainRecords.mockBlockHeight))
    .all()
    .find((x) => x.refTable === "contracts");
  if (!chain) return NextResponse.json({ ok: false, error: "NO_CHAIN" }, { status: 404 });

  const recomputed = chain.payload ? sha256(chain.payload) : "";
  return NextResponse.json({
    ok: recomputed === chain.sha256,
    contractSha: c.sha256,
    chainSha: chain.sha256,
    recomputed,
  });
}
