import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import { nftsByOwner, NFT_CONTRACT_ADDRESS } from "@/lib/nft";
import { getLocale, t } from "@/lib/i18n";

export const metadata = { title: "我的 NFT" };

export default async function CreatorNftsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/nfts");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const list = nftsByOwner(u.id);
  const talents = new Map<number, typeof schema.talents.$inferSelect>();
  for (const n of list) {
    const tl = db.select().from(schema.talents).where(eq(schema.talents.id, n.talentId)).get();
    if (tl) talents.set(n.talentId, tl);
  }

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="mb-6 text-[13px] text-ink-3 font-mono">
        Contract <span className="text-ink">{NFT_CONTRACT_ADDRESS}</span>
      </div>
      <PanelTitle hint={list.length ? tr("chain.total_records", { n: list.length }) : ""}>
        {tr("nft.my.title")}
      </PanelTitle>

      {list.length === 0 ? (
        <div className="glass rounded-[14px] p-8 text-center">
          <Sparkles size={20} className="mx-auto text-brand-2 mb-3" />
          <div className="text-[14px] text-ink-2">{tr("nft.my.empty")}</div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-tour="my-nfts">
          {list.map((n) => {
            const tl = talents.get(n.talentId);
            return (
              <Link
                key={n.id}
                href={`/nft/${n.tokenId}`}
                className="glass rounded-[14px] overflow-hidden hover:bg-white/[0.06] transition group"
              >
                <div
                  className="aspect-[16/10] relative"
                  style={{ background: tl?.cover ?? "linear-gradient(135deg,#6E59F6,#FF6FB4)" }}
                  aria-hidden
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute left-3 bottom-3 text-white">
                    <div className="text-[11px] uppercase tracking-widest opacity-80">
                      {tr("nft.title", { tokenId: n.tokenId })}
                    </div>
                    <div className="text-[15px] font-semibold leading-tight">
                      {tl?.stageName ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between text-[12px] text-ink-3">
                  <span className="font-mono">#{n.tokenId}</span>
                  <span>
                    {n.lastTransferAt
                      ? new Date(n.lastTransferAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })
                      : new Date(n.mintedAt * 1000).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
