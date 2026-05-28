import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

// 把中文 / 任意 Unicode 简单 ascii 化 — 只保留 a-z0-9,其它替换为 ""
function sanitizeAscii(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function buildSlugCandidate(nickname: string, userId: number): string {
  const base = sanitizeAscii(nickname || "");
  const hex6 = crypto.createHash("sha256").update(`mira-slug-${userId}-${nickname}`).digest("hex").slice(0, 6);
  if (!base) return `user-${userId}`;
  return `${base}-${hex6}`;
}

export function generateUserSlug(userId: number, nickname: string): string {
  // 兜底:user-<id>;含拼音字符就拼出 base-hex6
  let candidate = buildSlugCandidate(nickname, userId);
  // 冲突自旋
  for (let i = 0; i < 5; i++) {
    const dup = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.publicSlug, candidate))
      .get();
    if (!dup || dup.id === userId) return candidate;
    candidate = `${candidate}-${crypto.randomBytes(2).toString("hex")}`;
  }
  return `user-${userId}`;
}

export function ensureUserSlug(userId: number): string | null {
  const u = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!u) return null;
  if (u.publicSlug) return u.publicSlug;
  const slug = generateUserSlug(userId, u.nickname);
  db.update(schema.users).set({ publicSlug: slug }).where(eq(schema.users.id, userId)).run();
  return slug;
}

export function findUserByIdOrSlug(idOrSlug: string) {
  // 优先按 slug 查
  const bySlug = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicSlug, idOrSlug))
    .get();
  if (bySlug) return bySlug;
  const idN = Number(idOrSlug);
  if (!Number.isFinite(idN) || idN <= 0) return null;
  return db.select().from(schema.users).where(eq(schema.users.id, idN)).get() ?? null;
}
