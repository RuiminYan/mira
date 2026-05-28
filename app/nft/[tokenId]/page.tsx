import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Boxes, ArrowRight } from "lucide-react";
import { db, schema } from "@/db";
import { getNftByTokenId, nftTransfers, NFT_CONTRACT_ADDRESS } from "@/lib/nft";
import { shortHash } from "@/lib/chain";
import { getLocale, t } from "@/lib/i18n";

type Params = Promise<{ tokenId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const p = await params;
  const tokenId = Number(p.tokenId);
  return { title: `NFT #${tokenId}` };
}

export default async function NftDetailPage({ params }: { params: Params }) {
  const p = await params;
  const tokenId = Number(p.tokenId);
  if (!Number.isFinite(tokenId)) notFound();
  const nft = getNftByTokenId(tokenId);
  if (!nft) notFound();

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const talent = db.select().from(schema.talents).where(eq(schema.talents.id, nft.talentId)).get();
  const owner = db.select().from(schema.users).where(eq(schema.users.id, nft.ownerId)).get();
  const transfers = nftTransfers(nft.id);

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/chain" className="text-[13px] text-ink-3 hover:text-ink">
        ← {tr("nav.chain")}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div
          className="relative aspect-[4/5] rounded-[16px] overflow-hidden glow-ring"
          style={{ background: talent?.cover ?? "linear-gradient(135deg,#6E59F6,#FF6FB4)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-widest text-white">
            <Boxes size={12} /> mira-chain
          </div>
          <div className="absolute left-5 bottom-5 text-white">
            <div className="text-[12px] uppercase tracking-widest opacity-80 mb-1">
              {tr("nft.title", { tokenId: nft.tokenId })}
            </div>
            <div className="text-[26px] font-semibold leading-tight">{talent?.stageName ?? "—"}</div>
          </div>
        </div>

        <div>
          <div className="mb-4 text-[11px] uppercase tracking-widest text-ink-3">
            {tr("nft.snapshot")}
          </div>
          <div className="text-[28px] md:text-[36px] font-semibold leading-tight text-ink mb-3">
            {tr("nft.title", { tokenId: nft.tokenId })}
          </div>
          <div className="text-[13px] text-ink-3 mb-6">
            {talent?.stageName} · {talent?.gender === "male" ? tr("gender.male") : talent?.gender === "female" ? tr("gender.female") : tr("gender.neutral")} ·{" "}
            {talent?.grade ? tr(`grade.${talent.grade}`) : "—"}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("nft.contract")} value={nft.contractAddress} mono />
            <Field
              label={tr("nft.owner")}
              value={owner?.nickname ?? "—"}
              hint={owner?.email}
            />
            <Field
              label={tr("nft.minted_at")}
              value={new Date(nft.mintedAt * 1000).toLocaleString(
                locale === "en" ? "en-US" : "zh-CN",
                { hour12: false }
              )}
            />
            <Field
              label={tr("common.status")}
              value={
                nft.status === "minted"
                  ? tr("nft.status.minted")
                  : nft.status === "transferred"
                    ? tr("nft.status.transferred")
                    : tr("nft.status.burned")
              }
            />
            <Field label={tr("nft.metadata")} value={nft.metadataUri} mono />
            <Field
              label={tr("common.tags")}
              value={talent?.styleTags ?? "—"}
            />
          </div>

          {nft.chainRecordId && (
            <Link
              href={`/chain/${nft.chainRecordId}`}
              className="mt-6 inline-flex items-center gap-1 text-[13px] text-brand hover:underline"
            >
              {tr("market.nft.explorer")} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-14">
        <div className="mb-4 text-[12px] uppercase tracking-widest text-ink-3">
          {tr("nft.transfers")}
        </div>
        {transfers.length === 0 ? (
          <div className="glass rounded-[14px] p-6 text-[13px] text-ink-3">
            {tr("nft.no_transfers")}
          </div>
        ) : (
          <div className="glass rounded-[14px] overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">{tr("chain.col.height")}</th>
                  <th className="px-5 py-3 font-medium">{tr("nft.from")}</th>
                  <th className="px-5 py-3 font-medium">{tr("nft.to")}</th>
                  <th className="px-5 py-3 font-medium">{tr("chain.col.tx")}</th>
                  <th className="px-5 py-3 font-medium">{tr("chain.col.time")}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tr2) => {
                  const f = tr2.fromUserId
                    ? db.select().from(schema.users).where(eq(schema.users.id, tr2.fromUserId)).get()
                    : null;
                  const tgt = db
                    .select()
                    .from(schema.users)
                    .where(eq(schema.users.id, tr2.toUserId))
                    .get();
                  return (
                    <tr key={tr2.id} className="border-b border-line last:border-0 hover:bg-white/[0.04]">
                      <td className="px-5 py-3 font-mono text-ink">#{tr2.blockHeight.toLocaleString()}</td>
                      <td className="px-5 py-3 text-ink-3">{f?.nickname ?? "0x0"}</td>
                      <td className="px-5 py-3 text-ink-2">{tgt?.nickname ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-ink-3 text-[12px]">{shortHash(tr2.txHash)}</td>
                      <td className="px-5 py-3 text-ink-3 text-[12px]">
                        {new Date(tr2.createdAt * 1000).toLocaleString(
                          locale === "en" ? "en-US" : "zh-CN",
                          { hour12: false }
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {void NFT_CONTRACT_ADDRESS}
    </section>
  );
}

function Field({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div className="glass rounded-[12px] p-4">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">{label}</div>
      <div className={"text-[14px] text-ink truncate " + (mono ? "font-mono" : "")}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-ink-4 truncate">{hint}</div>}
    </div>
  );
}
