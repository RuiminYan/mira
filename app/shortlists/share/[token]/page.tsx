import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const metadata = { title: "选角清单 · 分享" };

export default async function SharedShortlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const p = await params;
  const list = db
    .select()
    .from(schema.shortlists)
    .where(eq(schema.shortlists.shareToken, p.token))
    .get();
  if (!list) notFound();
  const now = Math.floor(Date.now() / 1000);
  if (!list.shareExpiresAt || list.shareExpiresAt < now) {
    return (
      <section className="container-page py-16 text-center">
        <h1 className="text-[24px] font-semibold">链接已过期</h1>
        <p className="mt-2 text-ink-3 text-[13.5px]">请联系发起人重新生成。</p>
      </section>
    );
  }

  const owner = db.select().from(schema.users).where(eq(schema.users.id, list.userId)).get();

  const items = db
    .select({ i: schema.shortlistItems, t: schema.talents })
    .from(schema.shortlistItems)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.shortlistItems.talentId))
    .where(eq(schema.shortlistItems.shortlistId, list.id))
    .orderBy(asc(schema.shortlistItems.order))
    .all();

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">选角清单 · 分享</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">{list.name}</h1>
      {list.description && <p className="mt-2 text-[14px] text-ink-3 max-w-prose">{list.description}</p>}
      <div className="mt-2 text-[12.5px] text-ink-4">
        由 {owner?.nickname ?? "—"} 分享 · 链接 7 天有效
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((row) =>
          row.t ? (
            <Link
              key={row.i.id}
              href={`/marketplace/${row.t.id}`}
              className="rounded-[14px] overflow-hidden border border-line bg-surface hover:border-line-2 transition"
            >
              <div className="aspect-[4/5] w-full" style={{ background: row.t.cover }} aria-hidden />
              <div className="p-3">
                <div className="text-[14px] font-medium">{row.t.stageName}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">
                  {row.t.grade} 级 · ¥{row.t.priceOnce.toLocaleString()} · {row.t.revenueShare}%
                </div>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </section>
  );
}
