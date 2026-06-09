import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileCheck, AlertTriangle, CheckCircle2, Fingerprint, Download, Send, Tv, Smartphone, Video, MonitorPlay } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { openDispute, requestInvoice } from "@/app/actions/orders";
import { pushDistribution } from "@/app/actions/distributions";
import { ReviewBlock } from "@/components/ReviewBlock";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "订单详情" };

const loadSearch = createLoader({
  ok: parseAsString,
  err: parseAsString,
  paid: parseAsString,
});

const CHANNELS = [
  { key: "hongguo", label: "红果短剧", Icon: Tv, color: "text-red-300" },
  { key: "douyin", label: "抖音", Icon: Smartphone, color: "text-fuchsia-300" },
  { key: "kuaishou", label: "快手", Icon: Video, color: "text-amber-300" },
  { key: "videoaccount", label: "视频号", Icon: MonitorPlay, color: "text-emerald-300" },
] as const;

const DIST_STATUS_LABEL: Record<string, string> = {
  queued: "待推送",
  pushed: "已推送",
  live: "已上线",
  rejected: "已驳回",
};
const DIST_STATUS_TONE: Record<string, string> = {
  queued: "bg-amber-500/15 text-amber-300",
  pushed: "bg-sky-500/15 text-sky-300",
  live: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  approved: "已批准",
  delivered: "已交付",
  settled: "已结算",
  disputed: "争议中",
  refunded: "已退款",
  cancelled: "已取消",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  paid: "bg-sky-500/15 text-sky-300",
  approved: "bg-sky-500/15 text-sky-300",
  delivered: "bg-indigo-500/15 text-indigo-300",
  settled: "bg-emerald-500/15 text-emerald-300",
  disputed: "bg-red-500/15 text-red-300",
  refunded: "bg-white/[0.08] text-ink-2",
  cancelled: "bg-white/[0.08] text-ink-2",
};

export default async function PartnerOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await params;
  const sp = await loadSearch(searchParams);
  const id = Number(p.id);

  const u = await getCurrentUser();
  if (!u) redirect(`/login?role=partner&next=/partner/orders/${id}`);

  const o = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  if (!o) notFound();
  if (o.partnerId !== u.id && u.role !== "admin") redirect("/partner/orders");

  const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
  const contract = o.contractId
    ? db.select().from(schema.contracts).where(eq(schema.contracts.id, o.contractId)).get()
    : null;
  const pays = db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, o.id))
    .orderBy(desc(schema.payments.createdAt))
    .all();
  const inv = db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.orderId, o.id))
    .orderBy(desc(schema.invoices.createdAt))
    .all();
  const dispute = db
    .select()
    .from(schema.disputes)
    .where(eq(schema.disputes.orderId, o.id))
    .orderBy(desc(schema.disputes.createdAt))
    .all()[0];

  const deliveryPack = o.deliveryPackId
    ? db.select().from(schema.uploads).where(eq(schema.uploads.id, o.deliveryPackId)).get()
    : null;

  const distributions = db
    .select()
    .from(schema.distributions)
    .where(eq(schema.distributions.orderId, o.id))
    .all();
  const distByChannel = new Map(distributions.map((d) => [d.channel, d]));
  const deliveryChain = deliveryPack
    ? db
        .select()
        .from(schema.chainRecords)
        .where(eq(schema.chainRecords.refTable, "orders"))
        .all()
        .reverse()
        .find((c) => {
          try {
            const j = JSON.parse(c.payload ?? "{}") as { fingerprint?: string; event?: string };
            return j.event === "delivered_pack" && j.fingerprint === deliveryPack.sha256;
          } catch {
            return false;
          }
        })
    : null;

  const canDispute = ["paid", "approved", "delivered"].includes(o.status) && !dispute;
  const canInvoice =
    ["paid", "approved", "delivered", "settled"].includes(o.status) &&
    !inv.some((i) => i.status !== "void");

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/partner/orders" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回订单列表
      </Link>

      {sp.paid && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
          <CheckCircle2 size={14} /> 模拟支付成功,等待平台批准
        </div>
      )}
      {sp.ok === "dispute" && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/30 px-4 py-2 text-[13px] text-red-300">
          <AlertTriangle size={14} /> 争议已发起,等待平台仲裁
        </div>
      )}
      {sp.ok === "invoice" && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-500/10 border border-sky-500/30 px-4 py-2 text-[13px] text-sky-300">
          <FileCheck size={14} /> 发票申请已提交
        </div>
      )}
      {sp.ok === "pushed" && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
          <Send size={14} /> 分发推送成功
        </div>
      )}
      {sp.ok === "rejected" && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/30 px-4 py-2 text-[13px] text-red-300">
          <AlertTriangle size={14} /> 渠道未通过审核
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">订单 #{o.id}</div>
          <h1 className="text-[24px] md:text-[28px] font-semibold leading-tight">{o.projectName}</h1>
          <div className="text-[13px] text-ink-3 mt-1">{o.scope}</div>
        </div>
        <div className="text-right">
          <span
            className={
              "inline-flex rounded-full px-3 py-1 text-[12px] " + (STATUS_TONE[o.status] ?? "")
            }
          >
            {STATUS_LABEL[o.status] ?? o.status}
          </span>
          <div className="text-[20px] font-semibold text-ink mt-2">¥{o.amount.toLocaleString()}</div>
          <div className="text-[11px] text-ink-3">分账 {o.share}%</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-4">
          {contract && (
            <div className="glass rounded-[14px] p-5">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
                <FileCheck size={14} /> 授权合同
              </div>
              <div className="text-[14px] text-ink font-medium">{contract.partyAName} ↔ {contract.partyBName}</div>
              <div className="text-[12.5px] text-ink-3 mt-1 font-mono break-all">SHA256 {contract.sha256}</div>
              <Link
                href={`/contracts/${contract.id}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
              >
                打开合同视图
              </Link>
            </div>
          )}

          <div className="glass rounded-[14px] p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">支付记录</div>
            {pays.length === 0 ? (
              <div className="text-[13px] text-ink-3">还未发起支付</div>
            ) : (
              <div className="grid gap-2 text-[13px]">
                {pays.map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-line last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="text-ink">
                        {p.status === "succeeded" ? "已支付" : p.status === "refunded" ? "已退款" : "处理中"} · {p.channel === "wechat" ? "微信" : p.channel === "alipay" ? "支付宝" : "余额"}
                      </div>
                      <div className="text-[11px] text-ink-3 font-mono">{p.mockTradeNo}</div>
                    </div>
                    <div className={p.status === "refunded" ? "text-amber-300" : "text-ink"}>
                      {p.status === "refunded" ? "-" : "+"}¥{p.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {o.status === "pending" && (
              <Link
                href={`/partner/orders/${o.id}/pay`}
                className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
              >
                去支付 ¥{o.amount.toLocaleString()}
              </Link>
            )}
          </div>

          {deliveryPack && (
            <div className="glass rounded-[14px] p-5">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
                <Fingerprint size={14} /> 交付包(模拟)
              </div>
              <div className="grid gap-2 text-[12.5px]">
                <div className="flex flex-wrap gap-2">
                  <span className="text-ink-3">Fingerprint</span>
                  <span className="font-mono text-ink break-all">{deliveryPack.sha256}</span>
                </div>
                {deliveryChain && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-ink-3">链上 TX</span>
                    <span className="font-mono text-ink break-all">{deliveryChain.mockTxHash}</span>
                  </div>
                )}
                <div className="text-ink-3">
                  虚拟路径 {deliveryPack.url} · 校验工具可独立核验
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={deliveryPack.url}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
                >
                  <Download size={12} /> 下载交付包(模拟)
                </a>
                <Link
                  href={`/verify?fp=${deliveryPack.sha256}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] text-ink-2 bg-white/[0.06] hover:text-ink"
                >
                  <Fingerprint size={12} /> 打开校验工具
                </Link>
              </div>
            </div>
          )}

          {distributions.length > 0 && (
            <div className="glass rounded-[14px] p-5">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
                <Send size={14} /> 分发到大厂
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CHANNELS.map(({ key, label, Icon, color }) => {
                  const d = distByChannel.get(key);
                  if (!d) return null;
                  return (
                    <div key={key} className="rounded-[12px] border border-line p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={14} className={color} />
                        <span className="text-[13px] text-ink font-medium">{label}</span>
                        <span
                          className={
                            "ml-auto inline-flex rounded-full px-2 py-0.5 text-[11px] " +
                            (DIST_STATUS_TONE[d.status] ?? "")
                          }
                        >
                          {DIST_STATUS_LABEL[d.status]}
                        </span>
                      </div>
                      {d.externalRefId && (
                        <div className="text-[11px] text-ink-3 font-mono break-all">
                          {d.externalRefId}
                        </div>
                      )}
                      {d.playUrl && (
                        <div className="text-[11px] text-ink-3 font-mono break-all mt-0.5">
                          {d.playUrl}
                        </div>
                      )}
                      {d.rejectReason && (
                        <div className="text-[11px] text-red-300 mt-1">{d.rejectReason}</div>
                      )}
                      {(d.status === "queued" || d.status === "rejected") && (
                        <form action={pushDistribution} className="mt-2">
                          <input type="hidden" name="id" value={d.id} />
                          <button className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white">
                            <Send size={11} /> {d.status === "rejected" ? "重新推送" : "推送"}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[11px] text-ink-3">
                每次推送均写入链上存证 · 30% 概率被渠道驳回(模拟),可重新推送
              </div>
            </div>
          )}

          {dispute && (
            <div className="glass rounded-[14px] p-5 border border-red-500/30">
              <div className="text-[12px] uppercase tracking-widest text-red-300 mb-3 inline-flex items-center gap-2">
                <AlertTriangle size={14} /> 争议
              </div>
              <div className="text-[13.5px] text-ink-2 leading-6">
                类型: {dispute.kind === "quality" ? "质量问题" : dispute.kind === "non_delivery" ? "未交付" : "超范围使用"}
                <br />
                描述: {dispute.description}
                <br />
                状态: {dispute.status === "submitted" ? "已提交" : dispute.status === "in_review" ? "仲裁中" : dispute.status === "upheld_creator" ? "支持创作者" : dispute.status === "upheld_partner" ? "支持制作方" : "已关闭"}
                {dispute.decisionNote && (
                  <>
                    <br />
                    仲裁结论: {dispute.decisionNote}
                  </>
                )}
              </div>
            </div>
          )}

          {inv.length > 0 && (
            <div className="glass rounded-[14px] p-5">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">发票</div>
              {inv.map((i) => (
                <div key={i.id} className="flex flex-wrap justify-between items-center gap-3 border-b border-line last:border-0 py-2">
                  <div>
                    <div className="text-[13.5px] text-ink">{i.companyName}</div>
                    <div className="text-[12px] text-ink-3 font-mono">{i.taxNumber}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-ink-3">
                      {i.titleType === "vat_special" ? "增值税专用" : "增值税普通"} · ¥{i.amount.toLocaleString()}
                    </span>
                    {i.status === "issued" ? (
                      <Link
                        href={`/invoices/${i.id}`}
                        className="rounded-md px-3 py-1 text-[12px] text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
                      >
                        查看发票
                      </Link>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[12px] bg-amber-500/15 text-amber-300">
                        {i.status === "requested" ? "申请中" : i.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 h-fit">
          {canDispute && (
            <form action={openDispute} className="glass rounded-[14px] p-5 grid gap-3">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 inline-flex items-center gap-2">
                <AlertTriangle size={14} /> 发起争议
              </div>
              <input type="hidden" name="orderId" value={o.id} />
              <label className="grid gap-1.5">
                <span className="text-[12px] text-ink-3">争议类型</span>
                <select
                  name="kind"
                  defaultValue="quality"
                  className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink"
                >
                  <option value="quality">质量问题</option>
                  <option value="non_delivery">未交付</option>
                  <option value="misuse">超范围使用</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-ink-3">详细描述</span>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="请描述具体问题与诉求"
                  className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-4"
                />
              </label>
              <button className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500">
                提交争议
              </button>
            </form>
          )}

          {canInvoice && (
            <form action={requestInvoice} className="glass rounded-[14px] p-5 grid gap-3">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 inline-flex items-center gap-2">
                <FileCheck size={14} /> 申请发票
              </div>
              <input type="hidden" name="orderId" value={o.id} />
              <label className="grid gap-1.5">
                <span className="text-[12px] text-ink-3">公司全称</span>
                <input
                  name="companyName"
                  required
                  placeholder="如 上海星河文化传媒有限公司"
                  className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-4"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-ink-3">税号(15-20 位)</span>
                <input
                  name="taxNumber"
                  required
                  pattern="^[A-Za-z0-9]{15,20}$"
                  placeholder="纳税人识别号"
                  className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-4"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-ink-3">发票类型</span>
                <select
                  name="titleType"
                  defaultValue="vat_general"
                  className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[13.5px] text-ink"
                >
                  <option value="vat_general">增值税普通发票</option>
                  <option value="vat_special">增值税专用发票</option>
                </select>
              </label>
              <button className="rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]">
                提交申请
              </button>
            </form>
          )}

          {o.status === "settled" && (
            <ReviewBlock orderId={o.id} fromUserId={u.id} role="partner_to_creator" />
          )}

          {t && (
            <div className="glass rounded-[14px] p-5">
              <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">关联形象</div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md" style={{ background: t.cover }} />
                <div className="min-w-0">
                  <div className="text-[14px] text-ink font-medium truncate">{t.stageName}</div>
                  <div className="text-[12px] text-ink-3 truncate">
                    {t.gender === "female" ? "女" : t.gender === "male" ? "男" : "中性"} · {t.ageBand}
                  </div>
                </div>
              </div>
              <Link
                href={`/marketplace/${t.id}`}
                className="mt-3 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-[12px] text-ink bg-white/[0.06] hover:bg-white/[0.1]"
              >
                查看广场页
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

