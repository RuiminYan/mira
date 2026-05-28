import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Fingerprint, CheckCircle2, XCircle } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyFingerprint } from "@/app/actions/messages";

export const metadata = { title: "指纹校验" };

type Search = Promise<{ fp?: string; err?: string }>;

export default async function VerifyPage({ searchParams }: { searchParams: Search }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/verify");

  const sp = await searchParams;
  const fp = (sp.fp ?? "").trim().toLowerCase();

  let match: {
    order: typeof schema.orders.$inferSelect | null;
    talent: typeof schema.talents.$inferSelect | null;
    partner: typeof schema.users.$inferSelect | null;
    deliveredAt: number;
    blockHeight: number;
    txHash: string;
  } | null = null;

  if (fp && /^[0-9a-f]{40,64}$/.test(fp)) {
    const upload = db
      .select()
      .from(schema.uploads)
      .where(and(eq(schema.uploads.kind, "delivery_pack"), eq(schema.uploads.sha256, fp)))
      .get();
    if (upload && upload.talentId) {
      const order = db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.deliveryPackId, upload.id))
        .get();
      const talent = db
        .select()
        .from(schema.talents)
        .where(eq(schema.talents.id, upload.talentId))
        .get();
      if (order) {
        const partner = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, order.partnerId))
          .get();
        const chain = db
          .select()
          .from(schema.chainRecords)
          .where(and(eq(schema.chainRecords.refTable, "orders"), eq(schema.chainRecords.refId, order.id)))
          .all()
          .reverse()
          .find((c) => {
            try {
              const j = JSON.parse(c.payload ?? "{}") as { fingerprint?: string };
              return j.fingerprint === fp;
            } catch {
              return false;
            }
          });
        match = {
          order,
          talent: talent ?? null,
          partner: partner ?? null,
          deliveredAt: upload.createdAt,
          blockHeight: chain?.mockBlockHeight ?? 0,
          txHash: chain?.mockTxHash ?? "",
        };
      }
    }
  }

  return (
    <section className="container-page py-12 md:py-16">
      <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Verify</div>
      <h1 className="text-[28px] font-semibold leading-tight md:text-[34px]">
        交付包指纹校验 · <span className="text-gradient">链上溯源</span>
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] text-ink-3">
        输入交付包 SHA256 指纹,核验该内容是否由 Mira 镜界平台合规生成,以及关联订单、形象与下单方。
      </p>

      <form action={verifyFingerprint} className="glass mt-8 grid gap-3 rounded-[14px] p-5 md:max-w-2xl">
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">Fingerprint(SHA256)</span>
          <input
            name="fp"
            defaultValue={fp}
            placeholder="64 位十六进制"
            className="rounded-md border border-line bg-bg/40 px-3 py-2.5 font-mono text-[13px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
            required
          />
        </label>
        {sp.err === "fp" && (
          <div className="text-[12px] text-red-300">指纹格式无效(应为 32-64 位十六进制)</div>
        )}
        <button className="inline-flex w-fit items-center gap-1.5 rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2 text-[13px] font-medium text-white hover:brightness-110">
          <Fingerprint size={14} /> 校验
        </button>
      </form>

      {fp && !match && (
        <div className="glass mt-6 inline-flex items-center gap-2 rounded-[14px] border border-red-500/30 px-5 py-3 text-[13px] text-red-300">
          <XCircle size={14} /> 未匹配 · 指纹未出现在链上记录中
        </div>
      )}

      {match && match.order && (
        <div className="glass mt-6 rounded-[14px] border border-emerald-500/30 p-5 md:max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-[13px] text-emerald-300">
            <CheckCircle2 size={14} /> 已匹配链上交付包
          </div>
          <dl className="grid gap-2 text-[13px]">
            <Row label="订单">
              {match.order.projectName} · #{match.order.id}
            </Row>
            <Row label="形象">{match.talent?.stageName ?? "—"}</Row>
            <Row label="制作方">{match.partner?.nickname ?? "—"}</Row>
            <Row label="交付时间">
              {new Date(match.deliveredAt * 1000).toLocaleString("zh-CN", { hour12: false })}
            </Row>
            <Row label="区块高度">#{match.blockHeight.toLocaleString()}</Row>
            <Row label="链上 TX">
              <span className="break-all font-mono text-[12px]">{match.txHash}</span>
            </Row>
            <Row label="Fingerprint">
              <span className="break-all font-mono text-[12px]">{fp}</span>
            </Row>
          </dl>
          <Link
            href={`/partner/orders/${match.order.id}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-3 py-1.5 text-[12px] text-ink-2 hover:text-ink"
          >
            打开订单
          </Link>
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 border-b border-line py-1.5 last:border-0">
      <dt className="w-24 shrink-0 text-[11px] uppercase tracking-widest text-ink-3">{label}</dt>
      <dd className="min-w-0 flex-1 text-ink-2">{children}</dd>
    </div>
  );
}
