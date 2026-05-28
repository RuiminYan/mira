import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { triggerOn } from "@/lib/achievements";
import { generateUserSlug } from "@/lib/userSlug";

const COOKIE = "mira.sid";
const COOKIE_MAX = 60 * 60 * 24 * 30;

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id)) return null;
  const u = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  return u ?? null;
}

export async function setSession(userId: number) {
  const c = await cookies();
  c.set(COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function loginOrRegister(
  email: string,
  nickname: string,
  role: "creator" | "partner" | "admin" | "mcn"
): Promise<User> {
  email = email.trim().toLowerCase();
  nickname = nickname.trim();
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) {
    await setSession(existing.id);
    triggerOn("login_day", existing.id);
    if (!existing.publicSlug) {
      const slug = generateUserSlug(existing.id, existing.nickname);
      db.update(schema.users)
        .set({ publicSlug: slug })
        .where(eq(schema.users.id, existing.id))
        .run();
    }
    return existing;
  }
  const created = db
    .insert(schema.users)
    .values({
      email,
      nickname: nickname || email.split("@")[0]!,
      role,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();
  const slug = generateUserSlug(created.id, created.nickname);
  db.update(schema.users).set({ publicSlug: slug }).where(eq(schema.users.id, created.id)).run();
  await setSession(created.id);
  triggerOn("login_day", created.id);
  return created;
}
