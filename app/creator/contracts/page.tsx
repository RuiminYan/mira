import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { contractTitle } from "@/lib/contract";
import { CREATOR_NAV as NAV } from "@/lib/nav";

export const metadata = { title: "我的合同" };

export default async function CreatorContracts() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/contracts");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const rows = db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.userId, u.id))
    .orderBy(desc(schema.contracts.signedAt))
    .all();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`共 ${rows.length} 份`}>我的合同</PanelTitle>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">
          暂无合同 · 实名通过 / 接单后会自动生成
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="glass rounded-[12px] p-5 flex flex-wrap gap-3 items-center justify-between hover:bg-white/[0.06] transition"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-ink">{contractTitle(c.kind)}</div>
                <div className="text-[12px] text-ink-3 mt-1 font-mono">
                  CT-{String(c.id).padStart(6, "0")} · SHA256 {c.sha256.slice(0, 18)}…
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] text-ink">
                  {c.amount > 0 ? `¥${c.amount.toLocaleString()}` : "—"}
                </div>
                <div className="text-[11px] text-ink-3 mt-0.5">
                  {new Date(c.signedAt * 1000).toLocaleDateString("zh-CN")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
