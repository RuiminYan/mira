import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { MCN_NAV as NAV } from "@/lib/nav";
import { inviteCreatorToMCN } from "@/app/actions/mcn";

export const metadata = { title: "邀请创作者" };

type Search = Promise<{ err?: string }>;

const ERR_MAP: Record<string, string> = {
  email: "请填写邮箱",
  notfound: "该邮箱对应的用户尚未注册",
  role: "该用户不是创作者身份",
};

export default async function InviteCreatorPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=mcn&next=/mcn/creators/invite");
  if (u.role !== "mcn" && u.role !== "admin") redirect("/");

  const err = sp.err ? ERR_MAP[sp.err] ?? "邀请失败" : null;

  return (
    <DashboardShell role={`MCN · ${u.nickname}`} nav={NAV}>
      <div className="max-w-xl">
        <PanelTitle hint="填邮箱 · 抽成 %">发起签约邀请</PanelTitle>
        {err && (
          <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-4 py-2 text-[13px] text-red-300">
            {err}
          </div>
        )}
        <form action={inviteCreatorToMCN} className="glass rounded-[14px] p-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] uppercase tracking-widest text-ink-3">创作者邮箱</span>
            <input
              name="email"
              type="email"
              required
              placeholder="creator@example.com"
              className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[14px] text-ink"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] uppercase tracking-widest text-ink-3">抽成百分比(0-50)</span>
            <input
              name="commissionPct"
              type="number"
              min={0}
              max={50}
              defaultValue={15}
              className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2 text-[14px] text-ink"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2.5 text-[14px] font-medium text-white"
          >
            发起邀请
          </button>
          <div className="text-[12px] text-ink-3">
            邀请发出后会以站内通知形式推送给创作者 · 创作者接受后正式生效 · 分账抽成按时间从生效日开始累计
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
