import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { KIND_MIME, MAX_BYTES, saveBufferToUploads } from "@/lib/files";
import { triggerOn } from "@/lib/achievements";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "");
  const talentIdRaw = form.get("talentId");
  const talentId = talentIdRaw ? Number(talentIdRaw) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
  }

  const allowed = KIND_MIME[kind];
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "BAD_KIND" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 413 });
  }

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "BAD_MIME", mime: file.type }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveBufferToUploads(u.id, buf, file.type);

  const r = db
    .insert(schema.uploads)
    .values({
      userId: u.id,
      talentId: talentId && Number.isFinite(talentId) ? talentId : null,
      kind: kind as
        | "avatar"
        | "video"
        | "photo"
        | "contract_pdf"
        | "payment_proof"
        | "delivery_pack",
      url: saved.url,
      sizeBytes: saved.size,
      mimeType: file.type,
      sha256: saved.sha256,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .returning()
    .get();

  if (kind === "avatar" || kind === "video") {
    triggerOn("upload", u.id, { uploadId: r.id, kind });
  }

  return NextResponse.json({ ok: true, url: saved.url, id: r.id, sha256: saved.sha256 });
}
