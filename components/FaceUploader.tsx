"use client";

import { useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Camera, Loader2 } from "lucide-react";

export function FaceUploader({ defaultUrl }: { defaultUrl?: string }) {
  const [, setUrl] = useQueryState(
    "url",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "photo");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json()) as { ok?: boolean; url?: string; error?: string };
      if (!j.ok || !j.url) {
        setErr(j.error ?? "UPLOAD_FAILED");
        setBusy(false);
        return;
      }
      setPreview(j.url);
      await setUrl(j.url);
    } catch {
      setErr("NETWORK");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      className={
        "glass relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[14px] border border-dashed " +
        (preview ? "border-line" : "border-line-2")
      }
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
        disabled={busy}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="参考脸" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <Camera size={28} className="text-brand-2" />
          <div className="text-[14px] text-ink-2">上传一张人脸照片</div>
          <div className="text-[12px] text-ink-3">JPG / PNG / WebP · ≤ 10MB</div>
        </>
      )}
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <Loader2 size={20} className="animate-spin" /> &nbsp;上传中
        </div>
      )}
      {err && (
        <div className="absolute inset-x-2 bottom-2 rounded-md bg-red-500/85 px-3 py-1.5 text-[12px] text-white">
          上传失败:{err}
        </div>
      )}
    </label>
  );
}
