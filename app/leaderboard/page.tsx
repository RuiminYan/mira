import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { Section } from "@/components/Section";
import { fetchBoard, listPeriods, LB_LABEL, currentPeriod, type LbKind } from "@/lib/leaderboard";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = {
  title: "排行榜",
  description: "月度 · 创作者收益 / 制作方投入 / 形象热度 排行榜。",
};

const KINDS: LbKind[] = ["creator_revenue", "partner_spend", "talent_orders"];

const loadSearch = createLoader({
  period: parseAsString,
  kind: parseAsString,
});

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await loadSearch(searchParams);
  const period = sp.period || currentPeriod();
  const kind = (KINDS as string[]).includes(sp.kind ?? "") ? (sp.kind as LbKind) : "creator_revenue";
  const board = fetchBoard(period, kind);
  const periods = listPeriods(6);

  // hydrate user / talent names
  const userIds = board.map((r) => r.userId).filter((x): x is number => x !== null && x !== undefined);
  const talentIds = board.map((r) => r.talentId).filter((x): x is number => x !== null && x !== undefined);
  const users = userIds.length
    ? db.select().from(schema.users).where(inArray(schema.users.id, userIds)).all()
    : [];
  const talents = talentIds.length
    ? db.select().from(schema.talents).where(inArray(schema.talents.id, talentIds)).all()
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const talentMap = new Map(talents.map((t) => [t.id, t]));

  return (
    <Section
      eyebrow="LEADERBOARD"
      title={
        <>
          月度<span className="text-gradient"> Top 10</span>
        </>
      }
      subtitle={`${period} · ${LB_LABEL[kind]}`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Link
              key={k}
              href={`/leaderboard?period=${period}&kind=${k}`}
              className={
                "rounded-md px-3 py-1.5 text-[13px] " +
                (k === kind
                  ? "bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white"
                  : "bg-white/[0.04] text-ink-2 hover:text-ink")
              }
            >
              {LB_LABEL[k]}
            </Link>
          ))}
        </div>
        <form className="ml-auto flex items-center gap-2" method="get" action="/leaderboard">
          <input type="hidden" name="kind" value={kind} />
          <label className="text-[12px] text-ink-3" htmlFor="lb-period">月份</label>
          <select
            id="lb-period"
            name="period"
            defaultValue={period}
            className="rounded-md bg-bg/40 border border-line px-2.5 py-1.5 text-[13px]"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-white/[0.06] px-3 py-1.5 text-[13px] text-ink-2">切换</button>
        </form>
      </div>

      {board.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-12 text-center text-ink-3">
          该期暂无数据,等待月底自动结算。
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {board.map((row) => {
            const u = row.userId ? userMap.get(row.userId) : null;
            const t = row.talentId ? talentMap.get(row.talentId) : null;
            const name = u?.nickname ?? t?.stageName ?? "—";
            const sub = u?.role === "creator" ? "创作者" : u?.role === "partner" ? "制作方" : t ? "形象" : "";
            const href = u
              ? u.role === "creator"
                ? `/u/${u.id}`
                : u.role === "partner"
                  ? `/p/${u.id}`
                  : "#"
              : t
                ? `/marketplace/${t.id}`
                : "#";
            const valueDisplay =
              kind === "talent_orders" ? `${row.value} 单` : `¥${row.value.toLocaleString()}`;
            return (
              <Link
                key={row.id}
                href={href}
                className={
                  "rounded-[14px] p-5 border " +
                  (row.rank <= 3
                    ? "bg-gradient-to-br from-amber-500/10 to-pink-500/5 border-amber-400/30"
                    : "border-line bg-surface/40")
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "grid h-10 w-10 place-items-center rounded-full font-semibold " +
                      (row.rank === 1
                        ? "bg-amber-400 text-[#1E1B4B]"
                        : row.rank === 2
                          ? "bg-zinc-300 text-[#1E1B4B]"
                          : row.rank === 3
                            ? "bg-amber-700/80 text-white"
                            : "bg-white/[0.06] text-ink-2")
                    }
                  >
                    {row.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-medium text-ink truncate">{name}</div>
                    <div className="text-[12px] text-ink-3">{sub}</div>
                  </div>
                </div>
                <div className="mt-4 text-[22px] font-semibold text-gradient leading-none">{valueDisplay}</div>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
