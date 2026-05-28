import crypto from "node:crypto";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ChainRecord } from "@/db/schema";

const START_HEIGHT = 8800000;

export function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function mockTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function nextBlockHeight(): number {
  const last = db
    .select()
    .from(schema.chainRecords)
    .orderBy(desc(schema.chainRecords.mockBlockHeight))
    .limit(1)
    .get();
  if (!last) return START_HEIGHT;
  return last.mockBlockHeight + 1;
}

export function mintRecord(
  refTable: string,
  refId: number,
  payloadObj: unknown
): ChainRecord {
  const payloadStr = JSON.stringify(payloadObj ?? {});
  const hash = sha256(payloadStr);
  const height = nextBlockHeight();
  const tx = mockTxHash();
  const now = Math.floor(Date.now() / 1000);
  const r = db
    .insert(schema.chainRecords)
    .values({
      refTable,
      refId,
      sha256: hash,
      mockBlockHeight: height,
      mockTxHash: tx,
      mockChain: "mira-chain",
      payload: payloadStr,
      createdAt: now,
    })
    .returning()
    .get();
  return r;
}

export function verifyRecord(
  record: ChainRecord,
  payloadObj: unknown
): { ok: boolean; recomputed: string; original: string } {
  const payloadStr = JSON.stringify(payloadObj ?? {});
  const recomputed = sha256(payloadStr);
  return { ok: recomputed === record.sha256, recomputed, original: record.sha256 };
}

export function formatBlockHeight(h: number): string {
  return "#" + h.toLocaleString();
}

export function shortHash(h: string, head = 10, tail = 8): string {
  if (h.length <= head + tail + 3) return h;
  return h.slice(0, head) + "…" + h.slice(-tail);
}
