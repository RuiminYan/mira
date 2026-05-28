import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getAchievements } from "@/lib/achievements";
import { rarityTone } from "@/lib/badges";
import { pinBadge } from "@/app/actions/badges";

export const metadata = { title: "我的徽章" };

export default async function MyBadgesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/badges");
  const sp = await searchParams;

  const rows = db
    .select({ ub: schema.userBadges, b: schema.badges })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.badges.id, schema.userBadges.badgeId))
    .where(eq(schema.userBadges.userId, u.id))
    .all();

  const achievements = getAchievements(u.id);
  const pinnedCount = rows.filter((r) => r.ub.pinned).length;

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">荣誉</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">徽章与成就</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        在公开主页最多可置顶 3 枚徽章。每项成就达到 100% 时,自动颁发对应徽章。
      </p>

      {sp.ok === "pin" && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          置顶状态已更新。
        </div>
      )}

      <div className="mt-8">
        <div className="text-[13px] font-medium text-ink-2 mb-3">
          我的徽章 ({rows.length}) · 已 pin {pinnedCount}/3
        </div>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            还没有徽章,继续努力!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rows.map((row) => (
              <div
                key={row.ub.id}
                className={
                  "rounded-[14px] border p-5 bg-gradient-to-br " + rarityTone(row.b.rarity)
                }
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.08] text-[18px]">
                    {iconChar(row.b.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-semibold truncate">{row.b.name}</div>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                        {row.b.rarity}
                      </span>
                    </div>
                    <div className="mt-1 text-[12.5px] opacity-80">{row.b.description}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11.5px] opacity-70">
                    {new Date(row.ub.earnedAt * 1000).toLocaleDateString("zh-CN")}
                  </span>
                  <form action={pinBadge}>
                    <input type="hidden" name="id" value={row.ub.id} />
                    <button
                      className={
                        "rounded-md px-2.5 py-1 text-[11.5px] " +
                        (row.ub.pinned
                          ? "bg-white/[0.18] text-white"
                          : "bg-white/[0.06] text-ink-2 hover:bg-white/[0.12]")
                      }
                    >
                      {row.ub.pinned ? "★ 已 pin" : "pin 到主页"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <div className="text-[13px] font-medium text-ink-2 mb-3">成就进度</div>
        <div className="grid gap-3 md:grid-cols-2">
          {achievements.map((a) => (
            <div key={a.code} className="rounded-[12px] border border-line bg-surface/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium text-ink">{a.name}</div>
                  <div className="text-[11.5px] text-ink-4">目标 {a.goal}</div>
                </div>
                <div className="text-[14px] font-semibold tabular-nums">
                  {a.progress}%
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={
                    "h-full " +
                    (a.completedAt
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                      : "bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]")
                  }
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function iconChar(icon: string): string {
  const m: Record<string, string> = {
    ShieldCheck: "✓",
    Sparkles: "✦",
    Crown: "♕",
    Flame: "✸",
    DollarSign: "¥",
    Gem: "◆",
    Award: "★",
    Building2: "▣",
  };
  return m[icon] ?? "★";
}
