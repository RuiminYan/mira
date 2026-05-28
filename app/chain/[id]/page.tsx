import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Boxes } from "lucide-react";
import { db, schema } from "@/db";

export const metadata = { title: "链上记录详情" };

const TABLE_LABEL: Record<string, string> = {
  contracts: "合同",
  talents: "形象",
  orders: "订单",
  takedowns: "下架",
  invoices: "发票",
  verifications: "实名",
};

export default async function ChainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const r = db.select().from(schema.chainRecords).where(eq(schema.chainRecords.id, id)).get();
  if (!r) notFound();

  let pretty = "";
  try {
    pretty = r.payload ? JSON.stringify(JSON.parse(r.payload), null, 2) : "{}";
  } catch {
    pretty = r.payload ?? "";
  }

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/chain" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回链浏览器
      </Link>

      <div className="mt-6 mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2 inline-flex items-center gap-2">
            <Boxes size={14} /> {r.mockChain}
          </div>
          <h1 className="text-[26px] md:text-[32px] font-semibold leading-tight">
            区块 <span className="text-gradient font-mono">#{r.mockBlockHeight.toLocaleString()}</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1">业务对象</div>
          <div className="text-ink">
            {TABLE_LABEL[r.refTable] ?? r.refTable} · #{r.refId}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <Row label="SHA256" value={r.sha256} mono />
        <Row label="TxHash" value={r.mockTxHash} mono />
        <Row
          label="时间戳"
          value={`${r.createdAt} · ${new Date(r.createdAt * 1000).toLocaleString("zh-CN", { hour12: false })}`}
        />
        <Row label="Chain" value={r.mockChain} />
      </div>

      <div className="mt-8">
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">Payload</div>
        <pre className="glass rounded-[12px] p-5 text-[12.5px] leading-6 text-ink-2 font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {pretty || "{}"}
        </pre>
      </div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass rounded-[12px] p-4 grid gap-1.5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3">{label}</div>
      <div className={"text-[13px] text-ink break-all " + (mono ? "font-mono" : "")}>{value}</div>
    </div>
  );
}
