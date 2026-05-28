import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { createQuote } from "@/app/actions/bundles";
import { DashboardShell } from "@/components/DashboardLayout";

export const metadata = { title: "发起议价" };

const NAV = [
  { href: "/partner", label: "概览" },
  { href: "/partner/orders", label: "我的订单" },
  { href: "/partner/quotes", label: "议价工作台" },
  { href: "/marketplace", label: "选角广场 →" },
];

type Search = Promise<{ talentId?: string; bundleId?: string; err?: string }>;

export default async function NewQuotePage({ searchParams }: { searchParams: Search }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/quotes/new");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");

  const sp = await searchParams;
  const talentId = sp.talentId ? Number(sp.talentId) : null;
  const bundleId = sp.bundleId ? Number(sp.bundleId) : null;

  const talent = talentId
    ? db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get()
    : null;
  const bundle = bundleId
    ? db.select().from(schema.bundles).where(eq(schema.bundles.id, bundleId)).get()
    : null;
  const refName = talent?.stageName ?? bundle?.name ?? "未指定";
  const suggestedAmount = talent?.priceOnce ?? bundle?.priceTotal ?? 1000;
  const suggestedShare = talent?.revenueShare ?? 6;

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <div className="mb-6">
        <Link href="/partner/quotes" className="text-[13px] text-ink-3 hover:text-ink">
          ← 返回议价工作台
        </Link>
      </div>
      <h2 className="text-[24px] font-semibold leading-tight">发起议价</h2>
      <p className="mt-2 text-[13.5px] text-ink-3">
        议价目标:{refName} · 挂牌价 ¥{suggestedAmount.toLocaleString()}
      </p>

      {sp.err && (
        <div className="mt-4 inline-flex rounded-md bg-red-500/15 px-3 py-1.5 text-[12px] text-red-300">
          {sp.err === "fields" ? "请填写完整项目信息" : sp.err === "target" ? "请指定议价目标" : sp.err}
        </div>
      )}

      <form action={createQuote} className="mt-8 glass grid gap-4 rounded-[14px] p-6 md:max-w-2xl">
        {talentId && <input type="hidden" name="talentId" value={talentId} />}
        {bundleId && <input type="hidden" name="bundleId" value={bundleId} />}
        <Field name="projectName" label="项目名称" placeholder="如《长生劫》12 集" required />
        <Field name="scope" label="授权场景" placeholder="如 漫剧男主 · 12 集 · 全网独播" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            name="offerAmount"
            label="我的报价(¥)"
            type="number"
            defaultValue={String(Math.floor(suggestedAmount * 0.85))}
            required
          />
          <Field
            name="offerShare"
            label="可接受分账(%)"
            type="number"
            defaultValue={String(suggestedShare)}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-2 inline-flex w-fit items-center justify-center rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[14px] font-medium text-white hover:brightness-110"
        >
          发起议价
        </button>
      </form>
    </DashboardShell>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] uppercase tracking-widest text-ink-3">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none transition placeholder:text-ink-4 focus:border-brand/70"
      />
    </label>
  );
}
