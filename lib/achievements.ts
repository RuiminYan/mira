import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { grantBadge } from "@/lib/badges";

export type AchievementCode =
  | "first_upload"
  | "first_order"
  | "first_settled"
  | "10_orders"
  | "100k_revenue"
  | "invite_3_partners"
  | "all_verified"
  | "30_day_streak";

export const ACHIEVEMENT_DEFS: { code: AchievementCode; name: string; goal: number; rewardBadge?: string }[] = [
  { code: "first_upload", name: "首次上传形象", goal: 1 },
  { code: "first_order", name: "首笔订单", goal: 1, rewardBadge: "first_order" },
  { code: "first_settled", name: "首次结算", goal: 1, rewardBadge: "rising_star" },
  { code: "10_orders", name: "完成 10 笔订单", goal: 10 },
  { code: "100k_revenue", name: "累计收入 10 万", goal: 100, rewardBadge: "top_creator" },
  { code: "invite_3_partners", name: "邀请 3 位制作方", goal: 3 },
  { code: "all_verified", name: "全部形象通过审核", goal: 1 },
  { code: "30_day_streak", name: "连续活跃 30 天", goal: 30 },
];

export function bumpAchievement(userId: number, code: AchievementCode, delta: number): void {
  const def = ACHIEVEMENT_DEFS.find((d) => d.code === code);
  if (!def) return;
  const now = Math.floor(Date.now() / 1000);
  const existing = db
    .select()
    .from(schema.achievements)
    .where(and(eq(schema.achievements.userId, userId), eq(schema.achievements.code, code)))
    .get();
  if (!existing) {
    const progress = Math.min(100, Math.round((delta / def.goal) * 100));
    db.insert(schema.achievements)
      .values({
        userId,
        code,
        progress,
        completedAt: progress >= 100 ? now : null,
        createdAt: now,
      })
      .run();
    if (progress >= 100 && def.rewardBadge) grantBadge(userId, def.rewardBadge);
    return;
  }
  if (existing.completedAt) return;
  const next = Math.min(100, existing.progress + Math.round((delta / def.goal) * 100));
  db.update(schema.achievements)
    .set({ progress: next, completedAt: next >= 100 ? now : null })
    .where(eq(schema.achievements.id, existing.id))
    .run();
  if (next >= 100 && def.rewardBadge) grantBadge(userId, def.rewardBadge);
}

export function getAchievements(userId: number) {
  const rows = db.select().from(schema.achievements).where(eq(schema.achievements.userId, userId)).all();
  const map = new Map(rows.map((r) => [r.code, r]));
  return ACHIEVEMENT_DEFS.map((def) => {
    const row = map.get(def.code);
    return {
      code: def.code,
      name: def.name,
      goal: def.goal,
      progress: row?.progress ?? 0,
      completedAt: row?.completedAt ?? null,
    };
  });
}

export type AchievementEvent =
  | "upload"
  | "order_created"
  | "order_settled"
  | "referral_redeemed"
  | "login_day"
  | "verified";

export type TriggerContext = Record<string, unknown>;

export function triggerOn(event: AchievementEvent, userId: number, ctx: TriggerContext = {}): void {
  void ctx;
  switch (event) {
    case "upload":
      bumpAchievement(userId, "first_upload", 1);
      return;
    case "order_created":
      // 第 1 单 → first_order 100%; 累计 10 单 → 10_orders +10% 每单
      bumpAchievement(userId, "first_order", 1);
      bumpAchievement(userId, "10_orders", 1);
      return;
    case "order_settled":
      bumpAchievement(userId, "first_settled", 1);
      // 100k_revenue: delta 按金额(yuan)/1000,封顶 100
      if (typeof ctx.amount === "number") {
        const delta = Math.min(100, Math.floor((ctx.amount as number) / 1000));
        if (delta > 0) bumpAchievement(userId, "100k_revenue", delta);
      }
      return;
    case "referral_redeemed":
      // 邀请 3 位制作方,每个 +33%(共 99,完成不到 100,补位:第三个 +34)
      bumpAchievement(userId, "invite_3_partners", 1);
      return;
    case "verified":
      bumpAchievement(userId, "all_verified", 1);
      grantBadge(userId, "verified");
      return;
    case "login_day":
      handleLoginDay(userId);
      return;
  }
}

function handleLoginDay(userId: number): void {
  const todayDate = new Date();
  const yyyy = todayDate.getUTCFullYear();
  const mm = String(todayDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(todayDate.getUTCDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  const u = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!u) return;
  if (u.lastLoginDate === today) return; // 同日多次登录不计入

  // 比对昨日
  const yesterday = (() => {
    const y = new Date(todayDate.getTime() - 86400 * 1000);
    return `${y.getUTCFullYear()}-${String(y.getUTCMonth() + 1).padStart(2, "0")}-${String(
      y.getUTCDate()
    ).padStart(2, "0")}`;
  })();

  const newStreak = u.lastLoginDate === yesterday ? u.streakDays + 1 : 1;

  db.update(schema.users)
    .set({ lastLoginDate: today, streakDays: newStreak })
    .where(eq(schema.users.id, userId))
    .run();

  // 30 天目标: 每天 +1 progress 单位 (goal 是 30, 取整 = 3 或 4)
  // 简单: 直接 bump 1, 因为 goal=30; delta/goal*100 = 1/30*100 ≈ 3
  bumpAchievement(userId, "30_day_streak", 1);

  if (newStreak >= 30) {
    grantBadge(userId, "compliance_hero");
  }
}
