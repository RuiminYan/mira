import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Section } from "@/components/Section";
import { submitEnterpriseLead } from "@/app/actions/plans";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = {
  title: "定价方案",
  description: "Mira 镜界 SaaS 三档套餐 — Starter / Growth / Enterprise,按需选购。",
};

const FEATURE_MATRIX: { label: string; starter: string; growth: string; enterprise: string }[] = [
  { label: "形象浏览 / 选角广场", starter: "全量", growth: "全量", enterprise: "全量" },
  { label: "每月订单数", starter: "10", growth: "200", enterprise: "无限" },
  { label: "API 调用 / 月", starter: "1k", growth: "100k", enterprise: "定制" },
  { label: "团队席位", starter: "1", growth: "5", enterprise: "无限" },
  { label: "Webhook 订阅", starter: "—", growth: "✓", enterprise: "✓" },
  { label: "公开 API", starter: "只读", growth: "读写", enterprise: "读写 + 高 QPS" },
  { label: "数据导出 (CSV / JSON)", starter: "—", growth: "✓", enterprise: "✓" },
  { label: "客户成功经理", starter: "—", growth: "邮件", enterprise: "专属 CSM" },
  { label: "合规审核 SLA", starter: "48h", growth: "24h", enterprise: "4h" },
  { label: "私有化部署", starter: "—", growth: "—", enterprise: "可选" },
];

const FAQS: { q: string; a: string }[] = [
  { q: "Starter 套餐是否永久免费?", a: "是,Starter 永久免费,适合个人创作者或小型工作室试用,核心功能不阉割。" },
  { q: "升级 / 降级会立即生效吗?", a: "升级立即生效并按比例补差,降级在当前周期结束后生效,不影响已付费配额。" },
  { q: "Enterprise 套餐价格如何确定?", a: "按席位、调用量、SLA 等级与合规要求综合定价,提交咨询后 1 个工作日内回复。" },
  { q: "支持哪些发票形式?", a: "增值税普通发票 / 专用发票均支持,后台一键开具并自动上链留证。" },
  { q: "API 速率限制?", a: "Starter 10 QPS,Growth 100 QPS,Enterprise 按合同约定独享带宽。" },
  { q: "数据如何保护?", a: "全部业务数据加密静态存储,行权事件 (KYC / 合同 / 订单) 哈希上链,Enterprise 客户可申请私有化部署。" },
];

const loadSearch = createLoader({
  ok: parseAsString,
  err: parseAsString,
});

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await loadSearch(searchParams);
  const plans = db
    .select()
    .from(schema.plans)
    .where(eq(schema.plans.status, "live"))
    .orderBy(desc(schema.plans.sortOrder))
    .all();
  const ordered = plans.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Section
        eyebrow="DEFINE YOUR SCALE"
        title={
          <>
            <span className="text-gradient">三档套餐</span>,从独立创作者到上市集团
          </>
        }
        subtitle="按需启用 API、Webhook、团队席位与专属客户成功 — 永远不为你不用的功能付费。"
        align="center"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {ordered.map((p) => {
            const features = safeArray(p.features);
            const isMid = p.code === "growth";
            return (
              <div
                key={p.id}
                className={
                  "relative flex flex-col rounded-[18px] p-7 " +
                  (isMid
                    ? "bg-gradient-to-br from-[#6E59F6] to-[#4F3DD8] text-white border border-white/15 glow-ring"
                    : "glass border border-line")
                }
              >
                {isMid && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#4F3DD8]">
                    最受欢迎
                  </span>
                )}
                <div className={"text-[13px] uppercase tracking-widest " + (isMid ? "text-white/70" : "text-ink-3")}>
                  {p.code}
                </div>
                <div className={"mt-1 text-[22px] font-semibold " + (isMid ? "text-white" : "text-ink")}>
                  {p.name}
                </div>
                <div className={"mt-5 flex items-end gap-1 " + (isMid ? "text-white" : "text-ink")}>
                  {p.priceMonth === 0 ? (
                    <span className="text-[40px] font-semibold leading-none">¥0</span>
                  ) : p.code === "enterprise" ? (
                    <span className="text-[28px] font-semibold leading-none">询价</span>
                  ) : (
                    <>
                      <span className="text-[40px] font-semibold leading-none">
                        ¥{(p.priceMonth / 100).toFixed(0)}
                      </span>
                      <span className={"text-[13px] " + (isMid ? "text-white/70" : "text-ink-3")}>/ 月</span>
                    </>
                  )}
                </div>
                {p.priceYear > 0 && p.code !== "enterprise" && (
                  <div className={"mt-1 text-[12px] " + (isMid ? "text-white/70" : "text-ink-3")}>
                    年付 ¥{(p.priceYear / 100).toFixed(0)} · 立省 {Math.round(100 - (p.priceYear / (p.priceMonth * 12)) * 100)}%
                  </div>
                )}
                <ul className={"mt-6 space-y-2 text-[13.5px] " + (isMid ? "text-white/90" : "text-ink-2")}>
                  {features.slice(0, 6).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className={isMid ? "text-white" : "text-brand-2"}>·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  {p.code === "enterprise" ? (
                    <a
                      href="#enterprise"
                      className={
                        "inline-flex items-center justify-center w-full rounded-md px-4 py-2.5 text-[14px] font-medium " +
                        (isMid
                          ? "bg-white text-[#4F3DD8]"
                          : "bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white")
                      }
                    >
                      联系销售
                    </a>
                  ) : (
                    <Link
                      href={`/me/subscription?upgrade=${p.code}`}
                      className={
                        "inline-flex items-center justify-center w-full rounded-md px-4 py-2.5 text-[14px] font-medium " +
                        (isMid
                          ? "bg-white text-[#4F3DD8]"
                          : "bg-white/[0.06] text-ink hover:bg-white/[0.12]")
                      }
                    >
                      {p.priceMonth === 0 ? "免费开始" : "立即升级"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section eyebrow="COMPARE" title="特性对比">
        <div className="rounded-[14px] border border-line overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead className="bg-white/[0.04] text-ink-3 text-[12px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3 font-medium">能力</th>
                <th className="text-left px-4 py-3 font-medium">Starter</th>
                <th className="text-left px-4 py-3 font-medium">Growth</th>
                <th className="text-left px-4 py-3 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((f) => (
                <tr key={f.label} className="border-t border-line">
                  <td className="px-4 py-3 text-ink-2">{f.label}</td>
                  <td className="px-4 py-3 text-ink-3">{f.starter}</td>
                  <td className="px-4 py-3 text-ink">{f.growth}</td>
                  <td className="px-4 py-3 text-ink">{f.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="FAQ" title="常见问题" align="left">
        <div className="grid gap-3 md:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-[12px] border border-line bg-surface/40 p-5">
              <div className="text-[14px] font-medium text-ink">{f.q}</div>
              <div className="mt-2 text-[13px] leading-6 text-ink-3">{f.a}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="enterprise"
        eyebrow="ENTERPRISE"
        title="为大集团定制"
        subtitle="千万级 API 调用、私有部署、合规审计、白手套客户成功 — 留下联系方式,我们 1 个工作日内回访。"
      >
        {sp.ok === "lead" && (
          <div className="mb-5 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-[13.5px] text-emerald-300">
            已收到您的咨询,1 个工作日内会有专属顾问联系。
          </div>
        )}
        {sp.err && (
          <div className="mb-5 rounded-md bg-red-500/10 border border-red-500/25 px-4 py-3 text-[13.5px] text-red-300">
            请检查必填项是否填写完整。
          </div>
        )}
        <form action={submitEnterpriseLead} className="grid gap-4 md:grid-cols-2 rounded-[14px] border border-line bg-surface/40 p-6">
          <Field label="公司名称" name="company" required />
          <Field label="姓名" name="contactName" required />
          <Field label="工作邮箱" name="email" type="email" required />
          <Field label="手机" name="phone" type="tel" />
          <Field label="团队规模" name="employees" placeholder="例如 50-200" />
          <Field label="行业" name="industry" placeholder="短剧 / 品牌 / 出海 / 教育..." />
          <label className="grid gap-1 md:col-span-2">
            <span className="text-[12px] text-ink-3">需求描述</span>
            <textarea
              name="requirement"
              rows={4}
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px] focus:border-brand outline-none"
              placeholder="重点关心的能力 / 预算区间 / 上线时间"
            />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-5 py-2.5 text-[14px] font-medium">
              提交咨询
            </button>
          </div>
        </form>
      </Section>
    </>
  );
}

function Field({ label, name, type = "text", required, placeholder }: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = `pricing-${name}`;
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="text-[12px] text-ink-3">
        {label}
        {required && <span className="text-brand-2"> *</span>}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px] focus:border-brand outline-none"
      />
    </label>
  );
}

function safeArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
