import { NextRequest, NextResponse } from "next/server";
import { verifyKey, hasScope, type Scope } from "@/lib/apikey";
import type { ApiKey } from "@/db/schema";

export type AuthCtx = {
  userId: number;
  scope: Scope[];
  record: ApiKey;
};

export function authFromReq(req: NextRequest): AuthCtx | NextResponse {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  if (!m) {
    return NextResponse.json(
      { ok: false, error: "missing Authorization: Bearer <key>" },
      { status: 401 }
    );
  }
  const result = verifyKey(m[1]!);
  if (!result) {
    return NextResponse.json({ ok: false, error: "invalid or revoked API key" }, { status: 401 });
  }
  return result;
}

export function requireScope(ctx: AuthCtx, need: Scope): NextResponse | null {
  if (!hasScope(ctx.scope, need)) {
    return NextResponse.json({ ok: false, error: `missing scope: ${need}` }, { status: 403 });
  }
  return null;
}

export function jsonOk<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function paginate(req: NextRequest, defaultLimit = 20, maxLimit = 100) {
  const url = new URL(req.url);
  const limit = Math.min(maxLimit, Math.max(1, Number(url.searchParams.get("limit") || defaultLimit)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
  return { limit, offset, url };
}
