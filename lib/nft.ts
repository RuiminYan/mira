import { eq, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db, schema } from "@/db";
import type { Nft, NftTransfer } from "@/db/schema";
import { mintRecord } from "./chain";

export const NFT_CONTRACT_ADDRESS = "0xMIRACHAIN0001";
const TOKEN_ID_START = 100001;

function nextTokenId(): number {
  const row = db
    .select()
    .from(schema.nfts)
    .orderBy(desc(schema.nfts.tokenId))
    .limit(1)
    .get();
  if (!row) return TOKEN_ID_START;
  return row.tokenId + 1;
}

function txHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

export function getNftByTalentId(talentId: number): Nft | null {
  const r = db.select().from(schema.nfts).where(eq(schema.nfts.talentId, talentId)).get();
  return r ?? null;
}

export function getNftByTokenId(tokenId: number): Nft | null {
  const r = db.select().from(schema.nfts).where(eq(schema.nfts.tokenId, tokenId)).get();
  return r ?? null;
}

export function nftTransfers(nftId: number): NftTransfer[] {
  return db
    .select()
    .from(schema.nftTransfers)
    .where(eq(schema.nftTransfers.nftId, nftId))
    .orderBy(desc(schema.nftTransfers.createdAt))
    .all();
}

export function totalNftCount(): number {
  const r = db.select({ c: sql<number>`count(*)` }).from(schema.nfts).get();
  return r?.c ?? 0;
}

export function mintNft(talentId: number, ownerId: number): Nft {
  // idempotent: if already minted, return existing
  const existing = getNftByTalentId(talentId);
  if (existing) return existing;

  const now = Math.floor(Date.now() / 1000);
  const tokenId = nextTokenId();
  const metadataUri = `/nfts/${tokenId}.json`;
  const talent = db.select().from(schema.talents).where(eq(schema.talents.id, talentId)).get();
  const owner = db.select().from(schema.users).where(eq(schema.users.id, ownerId)).get();

  const inserted = db
    .insert(schema.nfts)
    .values({
      talentId,
      ownerId,
      tokenId,
      contractAddress: NFT_CONTRACT_ADDRESS,
      metadataUri,
      status: "minted",
      mintedAt: now,
    })
    .returning()
    .get();

  const chain = mintRecord("nfts", inserted.id, {
    op: "mint",
    tokenId,
    contract: NFT_CONTRACT_ADDRESS,
    talentId,
    talentName: talent?.stageName ?? null,
    ownerId,
    ownerName: owner?.nickname ?? null,
    metadataUri,
    mintedAt: now,
  });

  db.update(schema.nfts)
    .set({ chainRecordId: chain.id })
    .where(eq(schema.nfts.id, inserted.id))
    .run();

  db.insert(schema.nftTransfers)
    .values({
      nftId: inserted.id,
      fromUserId: null,
      toUserId: ownerId,
      txHash: chain.mockTxHash,
      blockHeight: chain.mockBlockHeight,
      note: "mint",
      createdAt: now,
    })
    .run();

  return { ...inserted, chainRecordId: chain.id };
}

export function transferNft(nftId: number, toUserId: number, note: string = ""): NftTransfer | null {
  const nft = db.select().from(schema.nfts).where(eq(schema.nfts.id, nftId)).get();
  if (!nft) return null;
  if (nft.status === "burned") return null;
  if (nft.ownerId === toUserId) return null;
  const fromUserId = nft.ownerId;
  const now = Math.floor(Date.now() / 1000);

  const chain = mintRecord("nfts", nft.id, {
    op: "transfer",
    tokenId: nft.tokenId,
    contract: nft.contractAddress,
    from: fromUserId,
    to: toUserId,
    note,
    at: now,
  });

  const transfer = db
    .insert(schema.nftTransfers)
    .values({
      nftId: nft.id,
      fromUserId,
      toUserId,
      txHash: chain.mockTxHash,
      blockHeight: chain.mockBlockHeight,
      note,
      createdAt: now,
    })
    .returning()
    .get();

  db.update(schema.nfts)
    .set({
      ownerId: toUserId,
      status: "transferred",
      lastTransferAt: now,
    })
    .where(eq(schema.nfts.id, nft.id))
    .run();

  return transfer;
}

export function nftsByOwner(ownerId: number): Nft[] {
  return db
    .select()
    .from(schema.nfts)
    .where(eq(schema.nfts.ownerId, ownerId))
    .orderBy(desc(schema.nfts.mintedAt))
    .all();
}

void txHash;
