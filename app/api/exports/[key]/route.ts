import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  gdprDumpFor,
  ordersCsvFor,
  revenuesCsvFor,
  walletCsvFor,
} from "@/lib/exporter";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const p = await params;
  const job = db.select().from(schema.exportJobs).where(eq(schema.exportJobs.payloadKey, p.key)).get();
  if (!job) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  if (job.userId !== u.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (job.status !== "ready") return NextResponse.json({ ok: false, error: "not ready" }, { status: 409 });

  if (job.kind === "invoices_pdf") {
    return NextResponse.redirect(new URL(`/me/exports/${p.key}`, _req.url));
  }

  let body = "";
  let filename = "mira-export.csv";
  let contentType = "text/csv; charset=utf-8";

  if (job.kind === "orders_csv") {
    body = ordersCsvFor(u.id, u.role);
    filename = `orders-${u.id}.csv`;
  } else if (job.kind === "revenues_csv") {
    body = revenuesCsvFor(u.id);
    filename = `revenues-${u.id}.csv`;
  } else if (job.kind === "wallet_csv") {
    body = walletCsvFor(u.id);
    filename = `wallet-${u.id}.csv`;
  } else if (job.kind === "gdpr_all") {
    body = gdprDumpFor(u.id);
    filename = `mira-account-${u.id}.json`;
    contentType = "application/json; charset=utf-8";
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
