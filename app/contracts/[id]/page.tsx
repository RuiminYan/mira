import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileCheck, ShieldCheck } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { contractTitle } from "@/lib/contract";

export const metadata = { title: "合同详情" };

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const c = db.select().from(schema.contracts).where(eq(schema.contracts.id, id)).get();
  if (!c) notFound();

  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=/contracts/${id}`);

  let canView = u.role === "admin";
  if (c.userId === u.id) canView = true;
  if (c.orderId) {
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, c.orderId)).get();
    if (o && o.partnerId === u.id) canView = true;
  }
  if (!canView) redirect("/");

  const chainRecs = db
    .select()
    .from(schema.chainRecords)
    .where(eq(schema.chainRecords.refId, c.id))
    .orderBy(desc(schema.chainRecords.mockBlockHeight))
    .all()
    .filter((x) => x.refTable === "contracts");

  const chain = chainRecs[0];
  const signedDate = new Date(c.signedAt * 1000);

  let order: typeof schema.orders.$inferSelect | undefined;
  if (c.orderId) {
    order = db.select().from(schema.orders).where(eq(schema.orders.id, c.orderId)).get() ?? undefined;
  }
  const talent = c.talentId
    ? db.select().from(schema.talents).where(eq(schema.talents.id, c.talentId)).get()
    : null;

  return (
    <section className="container-page py-12 md:py-16">
      <Link href={u.role === "creator" ? "/creator/contracts" : "/partner/orders"} className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-[16px] p-8 leading-7 text-[14px] text-ink-2">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2 inline-flex items-center gap-2">
            <FileCheck size={14} /> 合同编号 MIRA-CT-{String(c.id).padStart(6, "0")}
          </div>
          <h1 className="text-[26px] md:text-[30px] font-semibold leading-tight text-ink">
            {contractTitle(c.kind)}
          </h1>
          <div className="mt-6 grid gap-3 text-[14px]">
            <Row label="甲方(授权使用方)" value={c.partyAName} />
            <Row label="乙方(肖像权人)" value={c.partyBName} />
            {talent && <Row label="授权形象" value={talent.stageName} />}
            <Row label="授权范围" value={c.scope} />
            {c.kind === "order_license" && order && (
              <Row label="对应项目" value={order.projectName} />
            )}
            {c.amount > 0 && <Row label="授权金额" value={`¥${c.amount.toLocaleString()}`} />}
            {c.share > 0 && <Row label="分账比例" value={`${c.share}%`} />}
            <Row label="签署时间" value={signedDate.toLocaleString("zh-CN", { hour12: false })} />
          </div>

          <div className="mt-8 text-[13.5px] text-ink-2 leading-7 border-t border-line pt-5">
            <p>
              本合同经甲乙双方在 Mira 镜界平台一致同意签署,合同核心条款经 SHA256 哈希后写入 mira-chain 联盟链
              形成不可篡改的存证,合同效力等同于纸质书面合同。
              乙方授权甲方在合同约定的"授权范围"内使用乙方的 AI 数字肖像;甲方不得超范围使用,
              不得用于色情、违法、政治敏感等内容,违者乙方有权主张被遗忘权下架并追究法律责任。
            </p>
            <p className="mt-3">
              授权金额一次性支付,分账比例按发行净收入计算并按月结算,
              个人所得税由平台按 20% 综合所得税率代扣代缴。
              本合同自双方电子签署之时起生效,有效期与对应项目周期一致。
            </p>
          </div>
        </div>

        <div className="grid gap-4 h-fit">
          <div className="glass rounded-[14px] p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
              <ShieldCheck size={14} /> 链上存证
            </div>
            <div className="grid gap-3 text-[12.5px]">
              <Row label="SHA256" value={c.sha256} mono small />
              {chain && (
                <>
                  <Row label="区块高度" value={`#${chain.mockBlockHeight.toLocaleString()}`} mono small />
                  <Row label="TxHash" value={chain.mockTxHash} mono small />
                  <Link
                    href={`/chain/${chain.id}`}
                    className="mt-1 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-[12px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
                  >
                    打开链上记录
                  </Link>
                </>
              )}
            </div>
          </div>

          <form action={`/api/contract/${c.id}/verify`} method="POST" className="glass rounded-[14px] p-5">
            <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">完整性校验</div>
            <p className="text-[12.5px] text-ink-3 leading-5 mb-3">
              重新计算合同 payload 的 SHA256,与链上记录比对,确认未被篡改。
            </p>
            <button className="rounded-md px-3 py-1.5 text-[12px] text-ink bg-white/[0.06] hover:bg-white/[0.1]">
              重新校验存证
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-[11px] uppercase tracking-widest text-ink-3">{label}</div>
      <div className={(small ? "text-[12px] " : "text-[14px] ") + "text-ink break-all " + (mono ? "font-mono" : "")}>
        {value}
      </div>
    </div>
  );
}
