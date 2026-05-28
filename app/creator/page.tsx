import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc, sql } from "drizzle-orm";
import { Sparkles, ShieldCheck, Coins, Upload } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "创作者后台" };

export default async function CreatorHome() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const talents = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.creatorId, u.id))
    .all();

  const rev = db
    .select({
      total: sql<number>`coalesce(sum(${schema.revenues.amount}), 0)`,
    })
    .from(schema.revenues)
    .where(eq(schema.revenues.creatorId, u.id))
    .get();

  const lastRev = db
    .select()
    .from(schema.revenues)
    .where(eq(schema.revenues.creatorId, u.id))
    .orderBy(desc(schema.revenues.createdAt))
    .limit(6)
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label="累计收益" value={`¥${(rev?.total ?? 0).toLocaleString()}`} sub="授权费 + 发行分账" />
        <StatTile label="入库形象" value={String(talents.length)} sub="可被搜索的脸资产" />
        <StatTile
          label="平均分账"
          value={
            talents.length
              ? `${Math.round(
                  talents.reduce((a, t) => a + t.revenueShare, 0) / talents.length
                )}%`
              : "—"
          }
          sub="多形象加权平均"
        />
        <StatTile
          label="独家锁定"
          value={String(talents.filter((t) => t.exclusive).length)}
          sub="独家形象数量"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div data-tour="creator-talents">
          <PanelTitle hint={talents.length ? `共 ${talents.length} 个` : "暂未上链"}>
            我的形象
          </PanelTitle>

          {talents.length === 0 ? (
            <div className="glass rounded-[14px] p-8 text-center">
              <Sparkles size={20} className="mx-auto text-brand-2 mb-3" />
              <div className="text-[14px] text-ink-2 mb-4">
                还没上链 · 上传第一张脸,签订《AI 肖像授权合同》后即可开始接单。
              </div>
              <Link
                href="/creator/talents/new"
                data-tour="creator-new"
                className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
              >
                <Upload size={14} /> 上传形象数据
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {talents.map((t) => (
                <Link
                  key={t.id}
                  href={`/marketplace/${t.id}`}
                  className="glass rounded-[12px] p-4 flex items-center gap-4 hover:bg-white/[0.06] transition"
                >
                  <div
                    className="h-14 w-14 rounded-md shrink-0"
                    style={{ background: t.cover }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-ink truncate">{t.stageName}</div>
                    <div className="text-[12px] text-ink-3 truncate">{t.styleTags}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] text-ink">¥{t.priceOnce.toLocaleString()}</div>
                    <div className="text-[11px] text-ink-3">分账 {t.revenueShare}%</div>
                  </div>
                </Link>
              ))}
              <Link
                href="/creator/talents/new"
                className="rounded-[12px] border border-dashed border-line-2 px-4 py-3 text-center text-[13px] text-ink-3 hover:border-brand hover:text-ink transition"
              >
                + 再上传一份形象数据
              </Link>
            </div>
          )}
        </div>

        <div>
          <PanelTitle hint="最近 6 条">最新分账流水</PanelTitle>
          {lastRev.length === 0 ? (
            <div className="glass rounded-[14px] p-6 text-[13.5px] text-ink-3">
              还没有流水 · 接到第一单授权后会出现在这里。
            </div>
          ) : (
            <div className="glass rounded-[14px] divide-y divide-line">
              {lastRev.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-ink truncate">{r.note}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5 inline-flex items-center gap-1">
                      {r.kind === "share" ? (
                        <>
                          <Coins size={11} /> 发行分账
                        </>
                      ) : r.kind === "license" ? (
                        <>
                          <ShieldCheck size={11} /> 授权费
                        </>
                      ) : r.kind === "withholding" ? (
                        <>
                          <Coins size={11} /> 个税代扣
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={11} /> 退款抵扣
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={
                      "text-[14px] font-medium shrink-0 " +
                      (r.amount >= 0 ? "text-ink" : "text-amber-300")
                    }
                  >
                    {r.amount >= 0 ? "+" : ""}¥{r.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
