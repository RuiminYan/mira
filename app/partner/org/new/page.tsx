import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardLayout";
import { PARTNER_NAV as NAV } from "@/lib/nav";
import { createOrganization } from "@/app/actions/orgs";

export const metadata = { title: "新建团队" };

export default async function NewOrgPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/org/new");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");
  const sp = await searchParams;

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <Link href="/partner" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回工作台
      </Link>
      <h1 className="mt-2 text-[24px] font-semibold">新建团队</h1>
      <p className="mt-1 text-[13.5px] text-ink-3 max-w-prose">
        团队下成员可共享订单视图、议价历史与对账数据。创建后你将成为团队 owner。
      </p>

      {sp.err === "name" && (
        <div className="mt-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-[13px] text-rose-300">
          团队名称必填
        </div>
      )}

      <form action={createOrganization} className="mt-6 grid gap-4 max-w-[560px]">
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">名称</span>
          <input
            name="name"
            required
            placeholder="例如 星河影业"
            className="rounded-md bg-bg/40 border border-line px-3 py-2.5 text-[14px]"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">类型</span>
          <select
            name="kind"
            className="rounded-md bg-bg/40 border border-line px-3 py-2.5 text-[14px]"
          >
            <option value="studio">短剧工作室</option>
            <option value="brand">品牌方</option>
            <option value="agency">广告公司</option>
            <option value="mcn">MCN</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] uppercase tracking-widest text-ink-3">简介</span>
          <textarea
            name="description"
            rows={3}
            placeholder="主要业务、规模、需求方向"
            className="rounded-md bg-bg/40 border border-line px-3 py-2.5 text-[14px]"
          />
        </label>
        <button className="justify-self-start rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition">
          创建团队
        </button>
      </form>
    </DashboardShell>
  );
}
