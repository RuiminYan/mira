import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { PARTNER_NAV as NAV } from "@/lib/nav";
import { createShortlist } from "@/app/actions/favorites";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "选角清单" };

const loadSearch = createLoader({
  err: parseAsString,
});

export default async function ShortlistsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/shortlists");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");
  const sp = await loadSearch(searchParams);

  const lists = db
    .select({
      s: schema.shortlists,
      cnt: sql<number>`(select count(*) from ${schema.shortlistItems} where ${schema.shortlistItems.shortlistId} = ${schema.shortlists.id})`,
    })
    .from(schema.shortlists)
    .where(eq(schema.shortlists.userId, u.id))
    .orderBy(desc(schema.shortlists.createdAt))
    .all();

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${lists.length} 份`}>我的选角清单</PanelTitle>

      <form
        action={createShortlist}
        className="grid gap-3 md:grid-cols-[1fr_2fr_auto] mb-8 rounded-md border border-line bg-surface/40 p-4"
      >
        <input
          name="name"
          required
          placeholder="清单名称(如《九重凤阙》主角组)"
          className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px]"
        />
        <input
          name="description"
          placeholder="备注 / 项目用途"
          className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13px]"
        />
        <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13px]">
          新建清单
        </button>
      </form>

      {sp.err === "name" && (
        <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-[13px] text-rose-300">
          清单名称不能为空
        </div>
      )}

      {lists.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-12 text-center text-ink-3 text-[13px]">
          还没有选角清单
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {lists.map((row) => (
            <Link
              key={row.s.id}
              href={`/partner/shortlists/${row.s.id}`}
              className="rounded-[12px] border border-line bg-surface/40 p-4 hover:border-line-2 hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-medium">{row.s.name}</div>
                <div className="text-[11.5px] text-ink-4">{row.cnt} 人</div>
              </div>
              {row.s.description && (
                <div className="mt-1.5 text-[12.5px] text-ink-3 line-clamp-2">{row.s.description}</div>
              )}
              <div className="mt-3 text-[11.5px] text-ink-4">
                创建于 {new Date(row.s.createdAt * 1000).toLocaleDateString("zh-CN")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
