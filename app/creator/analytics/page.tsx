import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, StatTile, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import { LineChart, BarChartH, StackedBar, TwinBar } from "@/components/Chart";
import { similarPeers } from "@/lib/recommend";

export const metadata = { title: "数据驾驶舱" };

const SCENE_KEYWORDS: { label: string; keys: string[]; color: string }[] = [
  { label: "短剧", keys: ["短剧", "漫剧", "剧集"], color: "#6E59F6" },
  { label: "广告", keys: ["广告", "TVC", "代言"], color: "#FF6FB4" },
  { label: "出海", keys: ["出海", "海外", "international", "global"], color: "#22D3EE" },
  { label: "直播", keys: ["直播", "口播", "主播"], color: "#F59E0B" },
  { label: "品牌", keys: ["品牌", "TVC", "新品", "PR"], color: "#10B981" },
];

const DAYS = 30;

function dayKey(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDayAxis(days: number): string[] {
  const today = new Date();
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return out;
}

export default async function CreatorAnalytics() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/analytics");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const talents = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.creatorId, u.id))
    .all();
  const talentIds = talents.map((t) => t.id);

  const allOrders =
    talentIds.length === 0
      ? []
      : db
          .select()
          .from(schema.orders)
          .where(inArray(schema.orders.talentId, talentIds))
          .all();

  const revenues = db
    .select()
    .from(schema.revenues)
    .where(eq(schema.revenues.creatorId, u.id))
    .all();

  const nowSec = Math.floor(Date.now() / 1000);
  const thirtyAgo = nowSec - DAYS * 24 * 3600;
  const recentOrders = allOrders.filter((o) => o.createdAt >= thirtyAgo);
  const recentLicense = recentOrders.reduce((a, o) => a + o.amount, 0);

  // 复购率
  const partnerSet = new Map<number, number>();
  for (const o of allOrders) {
    partnerSet.set(o.partnerId, (partnerSet.get(o.partnerId) ?? 0) + 1);
  }
  const totalPartners = partnerSet.size;
  const repeatPartners = Array.from(partnerSet.values()).filter((c) => c >= 2).length;
  const repeatRate = totalPartners > 0 ? (repeatPartners / totalPartners) * 100 : 0;

  // S 级独家分账占比
  const sExclusiveIds = new Set(
    talents.filter((t) => t.grade === "S" && t.exclusive).map((t) => t.id)
  );
  const sExclusiveShare = revenues
    .filter((r) => {
      const o = allOrders.find((x) => x.id === r.orderId);
      if (!o) return false;
      return sExclusiveIds.has(o.talentId) && r.kind === "share";
    })
    .reduce((a, b) => a + b.amount, 0);
  const totalShareAll = revenues.filter((r) => r.kind === "share").reduce((a, b) => a + b.amount, 0);
  const sExclusivePct = totalShareAll > 0 ? (sExclusiveShare / totalShareAll) * 100 : 0;

  // Trend: 30 days
  const axis = buildDayAxis(DAYS);
  const licenseMap = new Map<string, number>();
  const shareMap = new Map<string, number>();
  for (const r of revenues) {
    if (r.createdAt < thirtyAgo) continue;
    const k = dayKey(r.createdAt);
    if (r.kind === "license") licenseMap.set(k, (licenseMap.get(k) ?? 0) + r.amount);
    if (r.kind === "share") shareMap.set(k, (shareMap.get(k) ?? 0) + r.amount);
  }
  const licenseLine = axis.map((x) => ({ x, y: licenseMap.get(x) ?? 0 }));
  const shareLine = axis.map((x) => ({ x, y: shareMap.get(x) ?? 0 }));

  // Talent heat (GMV per talent)
  const gmvByTalent = new Map<number, number>();
  for (const o of allOrders) {
    gmvByTalent.set(o.talentId, (gmvByTalent.get(o.talentId) ?? 0) + o.amount);
  }
  const heatItems = talents
    .map((t) => ({ label: t.stageName.split(" · ")[0] ?? t.stageName, value: gmvByTalent.get(t.id) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Scene distribution
  const sceneTotals = SCENE_KEYWORDS.map((s) => ({ label: s.label, value: 0, color: s.color }));
  for (const o of allOrders) {
    const text = `${o.scope} ${o.projectName}`;
    let matched = false;
    for (let i = 0; i < SCENE_KEYWORDS.length; i++) {
      const cfg = SCENE_KEYWORDS[i]!;
      if (cfg.keys.some((k) => text.includes(k))) {
        sceneTotals[i]!.value += o.amount;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // ignore unmatched to keep clean
    }
  }

  // exclusive vs non-exclusive
  const exTalentIds = new Set(talents.filter((t) => t.exclusive).map((t) => t.id));
  let exLicense = 0;
  let exShare = 0;
  let nonExLicense = 0;
  let nonExShare = 0;
  for (const r of revenues) {
    const o = allOrders.find((x) => x.id === r.orderId);
    if (!o) continue;
    if (exTalentIds.has(o.talentId)) {
      if (r.kind === "license") exLicense += r.amount;
      if (r.kind === "share") exShare += r.amount;
    } else {
      if (r.kind === "license") nonExLicense += r.amount;
      if (r.kind === "share") nonExShare += r.amount;
    }
  }
  const exVsPair = [
    { label: "独家", a: exLicense, b: exShare, aName: "授权费", bName: "分账" },
    { label: "非独家", a: nonExLicense, b: nonExShare, aName: "授权费", bName: "分账" },
  ];

  // Distribution overview by channel
  const myOrderIds = allOrders.map((o) => o.id);
  const dists =
    myOrderIds.length === 0
      ? []
      : db
          .select()
          .from(schema.distributions)
          .where(inArray(schema.distributions.orderId, myOrderIds))
          .all();
  const channelCount: Record<string, { pushed: number; live: number; queued: number; rejected: number }> = {
    hongguo: { pushed: 0, live: 0, queued: 0, rejected: 0 },
    douyin: { pushed: 0, live: 0, queued: 0, rejected: 0 },
    kuaishou: { pushed: 0, live: 0, queued: 0, rejected: 0 },
    videoaccount: { pushed: 0, live: 0, queued: 0, rejected: 0 },
  };
  for (const d of dists) {
    const c = channelCount[d.channel];
    if (!c) continue;
    if (d.status === "live") c.live++;
    else if (d.status === "pushed") c.pushed++;
    else if (d.status === "rejected") c.rejected++;
    else c.queued++;
  }

  // peer benchmark
  const allTalents = db.select().from(schema.talents).where(eq(schema.talents.status, "live")).all();
  const myTopTalent = talents.slice().sort((a, b) => b.followers - a.followers)[0];
  let peers: { name: string; gmv: number }[] = [];
  let myGmv = 0;
  let peersMedian = 0;
  if (myTopTalent) {
    myGmv = gmvByTalent.get(myTopTalent.id) ?? 0;
    const peerTalents = similarPeers(myTopTalent, allTalents, 3);
    const peerIds = peerTalents.map((p) => p.id);
    const peerOrders =
      peerIds.length === 0
        ? []
        : db.select().from(schema.orders).where(inArray(schema.orders.talentId, peerIds)).all();
    const peerGmv = new Map<number, number>();
    for (const o of peerOrders) {
      peerGmv.set(o.talentId, (peerGmv.get(o.talentId) ?? 0) + o.amount);
    }
    peers = peerTalents.map((p) => ({
      name: p.stageName.split(" · ")[0] ?? p.stageName,
      gmv: peerGmv.get(p.id) ?? 0,
    }));
    const sorted = peers.map((p) => p.gmv).sort((a, b) => a - b);
    if (sorted.length > 0) {
      peersMedian = sorted[Math.floor(sorted.length / 2)] ?? 0;
    }
  }

  const youAreLeader = myGmv >= peersMedian && myGmv > 0;

  void and;

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile
          label="近 30 天授权数"
          value={String(recentOrders.length)}
          sub="按订单创建时间"
        />
        <StatTile
          label="近 30 天 GMV"
          value={`¥${recentLicense.toLocaleString()}`}
          sub="授权费合计"
        />
        <StatTile
          label="复购率"
          value={`${repeatRate.toFixed(1)}%`}
          sub={`${repeatPartners} / ${totalPartners} 制作方复购`}
        />
        <StatTile
          label="S 级独家分账占比"
          value={`${sExclusivePct.toFixed(1)}%`}
          sub="头部分账贡献"
        />
      </div>

      <div className="mb-10">
        <PanelTitle hint="近 30 天">收益趋势</PanelTitle>
        <LineChart
          datasets={[
            { name: "授权费", color: "#6E59F6", data: licenseLine },
            { name: "发行分账", color: "#FF6FB4", data: shareLine },
          ]}
        />
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <PanelTitle hint="累计 GMV">形象热度排行</PanelTitle>
          <BarChartH items={heatItems} />
        </div>
        <div>
          <PanelTitle hint="按订单金额聚类">场景分布</PanelTitle>
          <StackedBar items={sceneTotals.filter((s) => s.value > 0)} />
        </div>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <PanelTitle hint="授权费 vs 分账">独家 / 非独家收益</PanelTitle>
          <TwinBar pairs={exVsPair} />
        </div>
        <div>
          <PanelTitle hint="4 个渠道">分发概览</PanelTitle>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(channelCount).map(([ch, c]) => {
              const total = c.live + c.pushed + c.queued + c.rejected;
              const label =
                ch === "hongguo"
                  ? "红果短剧"
                  : ch === "douyin"
                    ? "抖音"
                    : ch === "kuaishou"
                      ? "快手"
                      : "视频号";
              return (
                <div key={ch} className="glass rounded-[12px] p-4">
                  <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1.5">
                    {label}
                  </div>
                  <div className="text-[20px] font-semibold text-ink leading-none">
                    {c.live}
                    <span className="text-[12px] text-ink-3 ml-1">已上线</span>
                  </div>
                  <div className="text-[11px] text-ink-3 mt-2">
                    推送 {c.pushed} · 待推 {c.queued} · 驳回 {c.rejected} · 共 {total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {myTopTalent && peers.length > 0 && (
        <div className="mb-10">
          <PanelTitle hint="同标签 Top 3">相似优秀同行</PanelTitle>
          <div className="glass rounded-[14px] p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1">你 · 头部形象</div>
                <div className="text-[16px] font-semibold text-ink">{myTopTalent.stageName.split(" · ")[0]}</div>
                <div className="text-[22px] font-semibold text-gradient mt-2">
                  ¥{myGmv.toLocaleString()}
                </div>
                <div className="text-[11px] text-ink-3 mt-1.5">累计 GMV</div>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {peers.map((p) => (
                  <div key={p.name} className="rounded-[12px] border border-line p-3">
                    <div className="text-[13px] text-ink-2 truncate">{p.name}</div>
                    <div className="text-[16px] text-ink font-semibold mt-1">
                      ¥{p.gmv.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-ink-3 mt-1">同标签同行 · 累计 GMV</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-[13px] text-ink-2">
              {youAreLeader
                ? "你已是同标签头部 · 继续保持档期与片单更新节奏。"
                : `中位数 ¥${peersMedian.toLocaleString()} · 还有提升空间,建议提高活跃接单频次或上调档期单价。`}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
