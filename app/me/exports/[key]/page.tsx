import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Invoice — 打印为 PDF" };

export default async function ExportPrintPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const p = await params;
  const job = db.select().from(schema.exportJobs).where(eq(schema.exportJobs.payloadKey, p.key)).get();
  if (!job) notFound();
  if (job.userId !== u.id) notFound();

  // Render all the user's invoices in a print-friendly format
  const invoices = db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.partnerId, u.id))
    .all();

  return (
    <section className="container-page py-10 md:py-14">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .invoice { page-break-after: always; border: 1px solid #ccc !important; background: white !important; }
        }
        .invoice { padding: 32px; }
      `}</style>
      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3">导出</div>
          <h1 className="mt-1 text-[22px] font-semibold">发票 · 可打印</h1>
          <p className="mt-1 text-[13px] text-ink-3">按 Ctrl/Cmd + P 即可导出为 PDF。</p>
        </div>
        <a href="/me/exports" className="text-[13px] text-ink-3 hover:text-ink">← 返回</a>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
          没有可导出的发票
        </div>
      ) : (
        <div className="grid gap-6">
          {invoices.map((inv) => (
            <article
              key={inv.id}
              className="invoice rounded-[10px] border border-line bg-white text-black"
              style={{ background: "#fff", color: "#000" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #333", paddingBottom: "16px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "#666" }}>Mira 镜界 · INVOICE</div>
                  <div style={{ fontSize: "22px", fontWeight: 600, marginTop: "6px" }}>
                    增值税{inv.titleType === "vat_special" ? "专用" : "普通"}发票
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "#444" }}>
                  <div>发票号 {inv.invoiceNo ?? "—"}</div>
                  <div>状态 {inv.status}</div>
                  <div>开具日期 {inv.issuedAt ? new Date(inv.issuedAt * 1000).toLocaleDateString("zh-CN") : "—"}</div>
                </div>
              </div>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#666", width: "30%" }}>购方公司</td>
                    <td style={{ padding: "8px 0", fontWeight: 600 }}>{inv.companyName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#666" }}>纳税人识别号</td>
                    <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{inv.taxNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#666" }}>关联订单</td>
                    <td style={{ padding: "8px 0" }}>#{inv.orderId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#666" }}>金额</td>
                    <td style={{ padding: "8px 0", fontSize: "20px", fontWeight: 600 }}>¥{inv.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0", color: "#666" }}>SHA256</td>
                    <td style={{ padding: "8px 0", fontFamily: "monospace", fontSize: "11px", wordBreak: "break-all" }}>
                      {inv.sha256 || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px dashed #999", fontSize: "11px", color: "#666" }}>
                本发票数据已通过 Mira 镜界 平台上链留证。如需核验,请在「合规中心」中输入发票号查询。
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
