import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";

type Check = { name: string; ok: boolean; ms: number; detail?: string };

function timeCheck<T>(name: string, fn: () => T): Check {
  const t0 = Date.now();
  try {
    const v = fn();
    return { name, ok: true, ms: Date.now() - t0, detail: typeof v === "number" ? String(v) : undefined };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t0, detail: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const checks: Check[] = [];
  checks.push(
    timeCheck("db.ping", () => {
      const r = db.run(sql`SELECT 1 as v`);
      return Number(r.changes ?? 1);
    })
  );
  checks.push(
    timeCheck("db.counts", () => {
      const r = db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM users`);
      return Number(r?.c ?? 0);
    })
  );
  checks.push(
    timeCheck("env", () => {
      return Number(!!process.env.NODE_ENV);
    })
  );

  const ok = checks.every((c) => c.ok);
  const body = {
    ok,
    service: "mira",
    version: "phase-8",
    time: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    checks,
  };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
