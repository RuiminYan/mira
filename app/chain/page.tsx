import Link from "next/link";
import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { Boxes, Link2 } from "lucide-react";
import { db, schema } from "@/db";
import { shortHash } from "@/lib/chain";
import { NFT_CONTRACT_ADDRESS, totalNftCount } from "@/lib/nft";
import { getLocale, t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t("chain.title", locale);
  const description = t("chain.subtitle", locale);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
  };
}

const TABLE_LABEL_ZH: Record<string, string> = {
  contracts: "合同",
  talents: "形象",
  orders: "订单",
  takedowns: "下架",
  invoices: "发票",
  verifications: "实名",
  nfts: "NFT",
  studio_jobs: "AI 生成",
  studio_recharges: "算力充值",
  wallet_txns: "钱包流水",
  withdrawals: "提现",
  distributions: "分发",
};

const TABLE_LABEL_EN: Record<string, string> = {
  contracts: "Contract",
  talents: "Face",
  orders: "Order",
  takedowns: "Takedown",
  invoices: "Invoice",
  verifications: "KYC",
  nfts: "NFT",
  studio_jobs: "AI gen",
  studio_recharges: "Credits",
  wallet_txns: "Wallet",
  withdrawals: "Payout",
  distributions: "Distribution",
};

export default async function ChainExplorerPage() {
  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const labelMap = locale === "en" ? TABLE_LABEL_EN : TABLE_LABEL_ZH;

  const rows = db
    .select()
    .from(schema.chainRecords)
    .orderBy(desc(schema.chainRecords.mockBlockHeight))
    .all();

  const lastHeight = rows[0]?.mockBlockHeight ?? 0;
  const nftCount = totalNftCount();

  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2 inline-flex items-center gap-2">
            <Boxes size={14} /> mira-chain
          </div>
          <h1 className="text-[28px] md:text-[34px] font-semibold leading-tight">
            {tr("chain.heading.pre")}
            <span className="text-gradient">{tr("chain.heading.em")}</span>
          </h1>
          <p className="text-ink-3 text-[14px] mt-2 max-w-xl leading-6">{tr("chain.subtitle")}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile label={tr("chain.stat.blocks")} value={"#" + lastHeight.toLocaleString()} sub={tr("chain.total_records", { n: rows.length })} />
        <StatTile label={tr("chain.stat.contract")} value={NFT_CONTRACT_ADDRESS} mono />
        <StatTile label={tr("chain.stat.nfts")} value={nftCount.toLocaleString()} sub="ERC-721 mock" />
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">{tr("chain.empty")}</div>
      ) : (
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">{tr("chain.col.height")}</th>
                <th className="px-5 py-3 font-medium">{tr("chain.col.type")}</th>
                <th className="px-5 py-3 font-medium">{tr("chain.col.sha256")}</th>
                <th className="px-5 py-3 font-medium">{tr("chain.col.tx")}</th>
                <th className="px-5 py-3 font-medium">{tr("chain.col.time")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-white/[0.04]">
                  <td className="px-5 py-3 font-mono text-ink">
                    <Link href={`/chain/${r.id}`} className="hover:text-brand-2 inline-flex items-center gap-1">
                      #{r.mockBlockHeight.toLocaleString()}
                      <Link2 size={11} />
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-2">
                    {labelMap[r.refTable] ?? r.refTable} · #{r.refId}
                  </td>
                  <td className="px-5 py-3 font-mono text-ink-2 text-[12px]">{shortHash(r.sha256)}</td>
                  <td className="px-5 py-3 font-mono text-ink-3 text-[12px]">{shortHash(r.mockTxHash)}</td>
                  <td className="px-5 py-3 text-ink-3 text-[12px]">
                    {new Date(r.createdAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatTile({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="glass rounded-[14px] p-5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-3">{label}</div>
      <div className={"text-[20px] font-semibold leading-tight text-gradient truncate " + (mono ? "font-mono" : "")}>
        {value}
      </div>
      {sub && <div className="mt-2 text-[12px] text-ink-3">{sub}</div>}
    </div>
  );
}
