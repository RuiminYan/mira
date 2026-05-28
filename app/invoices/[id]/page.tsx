import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "发票视图" };

export default async function InvoiceView({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = Number(p.id);
  const inv = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get();
  if (!inv) notFound();

  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=/invoices/${id}`);
  if (u.role !== "admin" && inv.partnerId !== u.id) redirect("/");

  const order = db.select().from(schema.orders).where(eq(schema.orders.id, inv.orderId)).get();
  const chain = db
    .select()
    .from(schema.chainRecords)
    .where(eq(schema.chainRecords.refId, inv.id))
    .orderBy(desc(schema.chainRecords.mockBlockHeight))
    .all()
    .find((x) => x.refTable === "invoices");

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/partner/orders" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回
      </Link>

      <div className="mt-6 relative bg-white text-[#15172A] rounded-[16px] p-8 md:p-10 shadow-2xl max-w-3xl mx-auto overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center pointer-events-none select-none"
        >
          <span className="text-[64px] md:text-[88px] font-semibold opacity-[0.06] rotate-[-22deg] tracking-widest">
            Mira 模拟发票 · 仅供原型演示
          </span>
        </div>

        <div className="relative">
          <div className="flex items-end justify-between border-b-2 border-[#15172A] pb-4 mb-6">
            <div>
              <div className="text-[12px] uppercase tracking-widest text-[#6A6F87]">增值税{inv.titleType === "vat_special" ? "专用" : "普通"}发票</div>
              <div className="text-[24px] font-semibold mt-1">Mira 镜界 AI 演员授权服务</div>
            </div>
            <div className="text-right text-[12px]">
              <div className="text-[#6A6F87]">发票号码</div>
              <div className="font-mono">{inv.invoiceNo ?? "—"}</div>
              <div className="text-[#6A6F87] mt-2">开具日期</div>
              <div>{inv.issuedAt ? new Date(inv.issuedAt * 1000).toLocaleDateString("zh-CN") : "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13.5px] mb-6">
            <Row label="购方名称" value={inv.companyName} />
            <Row label="纳税人识别号" value={inv.taxNumber} mono />
            <Row label="销方名称" value="上海镜界文化科技有限公司" />
            <Row label="销方税号" value="91310000MA1MIRADEMO00" mono />
          </div>

          <table className="w-full text-[13.5px] border-collapse mb-6">
            <thead>
              <tr className="bg-[#F4F4FA]">
                <th className="text-left px-3 py-2 border border-[#E0E0E8]">项目名称</th>
                <th className="text-right px-3 py-2 border border-[#E0E0E8]">金额(元)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border border-[#E0E0E8]">
                  AI 演员授权服务费 · {order?.projectName ?? `订单 #${inv.orderId}`}
                </td>
                <td className="text-right px-3 py-2 border border-[#E0E0E8]">¥{inv.amount.toLocaleString()}</td>
              </tr>
              <tr className="font-semibold">
                <td className="px-3 py-2 border border-[#E0E0E8] text-right">合计</td>
                <td className="text-right px-3 py-2 border border-[#E0E0E8]">¥{inv.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="border-t-2 border-[#15172A] pt-4 grid gap-1 text-[12px] text-[#6A6F87] font-mono break-all">
            <div>SHA256: {inv.sha256 || "—"}</div>
            {chain && (
              <div>
                链上区块: #{chain.mockBlockHeight.toLocaleString()} · TxHash {chain.mockTxHash}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid">
      <div className="text-[11px] uppercase tracking-widest text-[#6A6F87]">{label}</div>
      <div className={"text-[13.5px] mt-0.5 " + (mono ? "font-mono" : "")}>{value}</div>
    </div>
  );
}
