import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const MAX_BYTES = 50 * 1024 * 1024;

export const KIND_MIME: Record<string, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  photo: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  contract_pdf: ["application/pdf"],
  payment_proof: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  delivery_pack: ["application/zip", "application/x-zip-compressed", "video/mp4", "image/jpeg", "image/png"],
};

export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
  };
  return map[mime] ?? "bin";
}

export async function saveBufferToUploads(
  userId: number,
  buf: Buffer,
  mime: string
): Promise<{ url: string; relPath: string; size: number; sha256: string }> {
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString("hex");
  const ext = extFromMime(mime);
  const dir = path.join(process.cwd(), "public", "uploads", String(userId));
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${ts}-${rand}.${ext}`;
  const full = path.join(dir, fileName);
  await fs.writeFile(full, buf);
  const url = `/uploads/${userId}/${fileName}`;
  return { url, relPath: full, size: buf.length, sha256: sha };
}
