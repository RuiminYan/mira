import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { requestTakedown } from "@/app/actions/talents";
import { CREATOR_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "形象管理" };

type Search = Promise<{ ok?: string; err?: string }>;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  review: "审核中",
  live: "已上架",
  taken_down: "已下架",
};
const STATUS_TONE: Record<string, string> = {
  draft: "bg-white/[0.06] text-ink-2",
  review: "bg-amber-500/15 text-amber-300",
  live: "bg-emerald-500/15 text-emerald-300",
  taken_down: "bg-red-500/15 text-red-300",
};

export default async function CreatorTalentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const p = await params;
  const sp = await searchParams;
  const id = Number(p.id);

  const u = await getCurrentUser();
  if (!u) redirect(`/login?role=creator&next=/creator/talents/${id}`);
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, id)).get();
  if (!t) notFound();
  if (t.creatorId !== u.id && u.role !== "admin") redirect("/creator/talents");

  const orders = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.talentId, t.id))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const td = db
    .select()
    .from(schema.takedowns)
    .where(eq(schema.takedowns.talentId, t.id))
    .orderBy(desc(schema.takedowns.createdAt))
    .all()[0];

  const chainTakedown = td?.chainRecordId
    ? db
        .select()
        .from(schema.chainRecords)
        .where(eq(schema.chainRecords.id, td.chainRecordId))
        .get()
    : null;

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      {sp.ok === "takedown" && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-[13px] text-amber-300">
          <AlertTriangle size={14} /> 下架申请已提交,等待平台审核
        </div>
      )}
      {sp.err === "reason" && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-[13px] text-amber-300">
          <AlertTriangle size={14} /> 下架理由至少 5 个字符
        </div>
      )}

      <div className="flex flex-wrap gap-5 items-start justify-between mb-8">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-16 w-16 rounded-md shrink-0" style={{ background: t.cover }} />
          <div className="min-w-0">
            <h1 className="text-[22px] md:text-[26px] font-semibold leading-tight truncate">{t.stageName}</h1>
            <div className="text-[12.5px] text-ink-3 mt-1 truncate">
              {t.gender === "female" ? "女" : t.gender === "male" ? "男" : "中性"} · {t.ageBand} · {t.styleTags}
            </div>
            <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
              <span
                className={
                  "inline-flex rounded-full px-2 py-0.5 text-[12px] " + (STATUS_TONE[t.status] ?? "")
                }
              >
                {STATUS_LABEL[t.status] ?? t.status}
              </span>
              {u.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck size={11} /> 实名
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <Link
          href={`/marketplace/${t.id}`}
          className="rounded-md px-4 py-2 text-[13px] text-ink-2 bg-white/[0.06] hover:bg-white/[0.1]"
        >
          查看广场页
        </Link>
      </div>

      {t.status === "taken_down" && chainTakedown && (
        <div className="glass rounded-[14px] p-5 border border-red-500/30 mb-8">
          <div className="text-[12px] uppercase tracking-widest text-red-300 mb-2 inline-flex items-center gap-2">
            <AlertTriangle size={14} /> 已下架(被遗忘权)
          </div>
          <div className="text-[13px] text-ink-2 leading-6">
            下架时间: {new Date(chainTakedown.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}
            <br />
            链上区块: <Link href={`/chain/${chainTakedown.id}`} className="text-brand-2 hover:underline font-mono">#{chainTakedown.mockBlockHeight.toLocaleString()}</Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4">
          <div className="glass rounded-[14px] p-5">
            <PanelTitle hint={`共 ${orders.length} 单`}>授权订单</PanelTitle>
            {orders.length === 0 ? (
              <div className="text-[13px] text-ink-3">还没有订单</div>
            ) : (
              <div className="grid gap-2">
                {orders.map((o) => (
                  <div key={o.id} className="flex justify-between items-center border-b border-line last:border-0 pb-2 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-ink truncate">{o.projectName}</div>
                      <div className="text-[12px] text-ink-3 truncate">{o.scope}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13.5px] text-ink">¥{o.amount.toLocaleString()}</div>
                      <div className="text-[11px] text-ink-3">{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {t.status !== "taken_down" && (!td || td.status === "rejected") ? (
            <form action={requestTakedown} className="glass rounded-[14px] p-5 grid gap-3">
              <div className="text-[12px] uppercase tracking-widest text-red-300 inline-flex items-center gap-2">
                <AlertTriangle size={14} /> 申请下架(被遗忘权)
              </div>
              <p className="text-[12.5px] text-ink-3 leading-5">
                提交后管理员审核;通过后形象在选角广场下架,新订单不再接入,已签订单按合同继续履行。
                下架事实会写入 mira-chain。
              </p>
              <input type="hidden" name="talentId" value={t.id} />
              <textarea
                name="reason"
                required
                rows={3}
                placeholder="请说明下架理由(至少 5 字)"
                className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-4"
              />
              <button className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500">
                提交下架申请
              </button>
            </form>
          ) : td && td.status === "pending" ? (
            <div className="glass rounded-[14px] p-5 border border-amber-500/30">
              <div className="text-[12px] uppercase tracking-widest text-amber-300 mb-2">下架审核中</div>
              <div className="text-[13px] text-ink-2 leading-6">理由: {td.reason}</div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
