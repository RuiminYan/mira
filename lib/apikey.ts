import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ApiKey } from "@/db/schema";

const PREFIX_LEN = 8;
const SECRET_LEN = 32;

export type Scope =
  | "talents:read"
  | "orders:read"
  | "orders:write"
  | "webhooks:read"
  | "me:read";

export const ALL_SCOPES: Scope[] = [
  "talents:read",
  "orders:read",
  "orders:write",
  "webhooks:read",
  "me:read",
];

export const SCOPE_LABEL: Record<Scope, string> = {
  "talents:read": "读取人才",
  "orders:read": "读取订单",
  "orders:write": "创建订单",
  "webhooks:read": "读取 Webhook",
  "me:read": "读取自身信息",
};

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function parseScope(s: string): Scope[] {
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string") as Scope[];
  } catch {
    return [];
  }
}

export function issueKey(userId: number, name: string, scopeArr: Scope[]) {
  const prefix = crypto.randomBytes(4).toString("hex").slice(0, PREFIX_LEN);
  const secret = crypto.randomBytes(16).toString("hex").slice(0, SECRET_LEN);
  const key = `mira_live_${prefix}_${secret}`;
  const hash = sha256(secret);
  const record = db
    .insert(schema.apiKeys)
    .values({
      userId,
      name: name.trim().slice(0, 60) || "未命名 Key",
      prefix,
      hash,
      scope: JSON.stringify(scopeArr.length ? scopeArr : ["me:read"]),
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();
  return { key, record };
}

export function verifyKey(rawKey: string): { ok: true; userId: number; scope: Scope[]; record: ApiKey } | null {
  if (!rawKey) return null;
  const m = /^mira_live_([a-f0-9]{8})_([a-f0-9]{32})$/.exec(rawKey.trim());
  if (!m) return null;
  const prefix = m[1]!;
  const secret = m[2]!;
  const expectedHash = sha256(secret);
  const candidate = db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.prefix, prefix))
    .get();
  if (!candidate) return null;
  if (candidate.hash !== expectedHash) return null;
  if (candidate.revokedAt) return null;
  db.update(schema.apiKeys)
    .set({ lastUsedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.apiKeys.id, candidate.id))
    .run();
  return { ok: true, userId: candidate.userId, scope: parseScope(candidate.scope), record: candidate };
}

export function hasScope(scope: Scope[], need: Scope): boolean {
  return scope.includes(need);
}

export function revokeKey(id: number, userId: number): boolean {
  const k = db.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, id)).get();
  if (!k || k.userId !== userId) return false;
  if (k.revokedAt) return true;
  db.update(schema.apiKeys)
    .set({ revokedAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.apiKeys.id, id))
    .run();
  return true;
}

export function maskKey(prefix: string): string {
  return `mira_live_${prefix}_***`;
}

export function parseScopes(s: string): Scope[] {
  return parseScope(s);
}
