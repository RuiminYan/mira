import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { PARTNER_NAV as NAV } from "@/lib/nav";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import {
  bulkQuoteFromShortlist,
  removeShortlistItem,
  reorderShortlistItem,
  shareShortlist,
} from "@/app/actions/favorites";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "选角清单详情" };

const loadSearch = createLoader({
  ok: parseAsString,
});

export default async function ShortlistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner");
  const p = await params;
  const sp = await loadSearch(searchParams);
  const id = Number(p.id);
  const list = db
    .select()
    .from(schema.shortlists)
    .where(eq(schema.shortlists.id, id))
    .get();
  if (!list) notFound();
  if (list.userId !== u.id && u.role !== "admin") redirect("/partner/shortlists");

  const items = db
    .select({ i: schema.shortlistItems, t: schema.talents })
    .from(schema.shortlistItems)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.shortlistItems.talentId))
    .where(eq(schema.shortlistItems.shortlistId, id))
    .orderBy(asc(schema.shortlistItems.order))
    .all();

  const sharePath =
    list.shareToken && list.shareExpiresAt && list.shareExpiresAt > Math.floor(Date.now() / 1000)
      ? `/shortlists/share/${list.shareToken}`
      : null;
  const shareFullUrl = sharePath
    ? `${process.env.NEXT_PUBLIC_SITE_URL || ""}${sharePath}`
    : null;

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <Link href="/partner/shortlists" className="text-[13px] text-ink-3 hover:text-ink">
        ← 全部清单
      </Link>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[24px] font-semibold">{list.name}</h1>
          {list.description && <p className="text-[13.5px] text-ink-3 mt-1">{list.description}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {!sharePath ? (
            <form action={shareShortlist}>
              <input type="hidden" name="id" value={list.id} />
              <button className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]">
                生成只读分享链接
              </button>
            </form>
          ) : (
            <CopyLinkButton url={shareFullUrl || sharePath} label="复制分享链接" />
          )}
        </div>
      </div>

      {sp.ok === "share" && sharePath && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[12.5px] text-emerald-200">
          已生成分享链接(7 天有效):
          <code className="ml-2 font-mono text-emerald-100">{sharePath}</code>
        </div>
      )}

      <PanelTitle hint={`${items.length} 人`}>清单成员</PanelTitle>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
          清单为空 ·{" "}
          <Link href="/marketplace" className="text-ink hover:underline">
            去选角广场添加
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((row, idx) =>
            row.t ? (
              <div
                key={row.i.id}
                className="rounded-[10px] border border-line bg-surface/40 p-3 flex items-center gap-3"
              >
                <div
                  className="h-14 w-14 rounded-md flex-shrink-0"
                  style={{ background: row.t.cover }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/marketplace/${row.t.id}`}
                    className="text-[14px] font-medium hover:underline truncate block"
                  >
                    {row.t.stageName}
                  </Link>
                  <div className="text-[11.5px] text-ink-4 mt-0.5">
                    {row.t.grade} 级 · ¥{row.t.priceOnce.toLocaleString()} · 分账 {row.t.revenueShare}%
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <form action={reorderShortlistItem}>
                    <input type="hidden" name="itemId" value={row.i.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      disabled={idx === 0}
                      className="rounded-md p-1.5 hover:bg-white/[0.08] disabled:opacity-30 text-ink-3 text-[12px]"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={reorderShortlistItem}>
                    <input type="hidden" name="itemId" value={row.i.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      disabled={idx === items.length - 1}
                      className="rounded-md p-1.5 hover:bg-white/[0.08] disabled:opacity-30 text-ink-3 text-[12px]"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={removeShortlistItem}>
                    <input type="hidden" name="itemId" value={row.i.id} />
                    <button className="rounded-md p-1.5 hover:bg-rose-500/15 text-ink-3 hover:text-rose-300 text-[12px]">
                      移除
                    </button>
                  </form>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 glass rounded-[14px] p-5">
          <div className="text-[12.5px] uppercase tracking-widest text-ink-3 mb-2">整单议价</div>
          <p className="text-[13px] text-ink-3 mb-3">
            会为清单中的每个在售成员一次性创建一份独立议价(初始价 = 挂牌价),并把下方备注作为首条留言。
          </p>
          <form action={bulkQuoteFromShortlist} className="space-y-3">
            <input type="hidden" name="shortlistId" value={list.id} />
            <textarea
              name="message"
              rows={3}
              maxLength={500}
              placeholder="备注:档期 / 预算 / 独家诉求 etc."
              className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-[13.5px] text-ink outline-none focus:border-brand/70 leading-6"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13.5px] font-medium text-white"
              >
                整单议价({items.filter((r) => r.t?.status === "live").length} 人)
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
