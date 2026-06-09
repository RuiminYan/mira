import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { createExport } from "@/app/actions/exports";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "数据导出" };

const loadSearch = createLoader({ ok: parseAsString });

const KIND_LABEL: Record<string, string> = {
  gdpr_all: "全部账户数据 (GDPR · JSON)",
  orders_csv: "订单 (CSV)",
  revenues_csv: "收益 / 分账 (CSV)",
  invoices_pdf: "发票 (HTML 可打印为 PDF)",
  wallet_csv: "钱包流水 (CSV)",
};

export default async function MyExportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/exports");
  const sp = await loadSearch(searchParams);

  const jobs = db
    .select()
    .from(schema.exportJobs)
    .where(eq(schema.exportJobs.userId, u.id))
    .orderBy(desc(schema.exportJobs.requestedAt))
    .all();

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">账户</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">数据导出</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        所有数据归属于你 — 任何时刻都可一键导出。发票为 HTML 模板,浏览器 Ctrl+P 即可打印为 PDF。
      </p>

      {sp.ok && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已生成,可在下方下载。
        </div>
      )}

      <div className="mt-8 rounded-[14px] border border-line bg-surface/40 p-5">
        <div className="text-[14px] font-medium mb-3">发起导出</div>
        <form action={createExport} className="flex flex-wrap items-end gap-3">
          <label htmlFor="exp-kind" className="grid gap-1">
            <span className="text-[12px] text-ink-3">类型</span>
            <select
              id="exp-kind"
              name="kind"
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px]"
              defaultValue="orders_csv"
            >
              {Object.keys(KIND_LABEL).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13.5px] font-medium">
            生成导出文件
          </button>
        </form>
      </div>

      <div className="mt-10">
        <div className="text-[13px] font-medium text-ink-2 mb-3">导出记录 ({jobs.length})</div>
        {jobs.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            还没有导出
          </div>
        ) : (
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">类型</th>
                  <th className="text-left px-3 py-2">状态</th>
                  <th className="text-left px-3 py-2">请求时间</th>
                  <th className="text-left px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">{KIND_LABEL[j.kind] ?? j.kind}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[11px] " +
                          (j.status === "ready"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : j.status === "failed"
                              ? "bg-red-500/15 text-red-300"
                              : "bg-amber-500/15 text-amber-300")
                        }
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-3">
                      {new Date(j.requestedAt * 1000).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-3 py-2">
                      {j.status === "ready" ? (
                        j.kind === "invoices_pdf" ? (
                          <a
                            href={`/me/exports/${j.payloadKey}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-2 underline underline-offset-2 text-[12.5px]"
                          >
                            打开打印页
                          </a>
                        ) : (
                          <a
                            href={`/api/exports/${j.payloadKey}`}
                            className="text-brand-2 underline underline-offset-2 text-[12.5px]"
                          >
                            下载
                          </a>
                        )
                      ) : (
                        <span className="text-ink-4 text-[12.5px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
