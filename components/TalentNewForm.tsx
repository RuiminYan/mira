"use client";

import { useState, useTransition } from "react";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { createTalent } from "@/app/actions/talents";

type UploadResp =
  | { ok: true; url: string; id: number; sha256: string }
  | { ok: false; error: string };

export function TalentNewForm() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const [videoErr, setVideoErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleUpload(
    file: File,
    kind: "avatar" | "video",
    setUrl: (u: string | null) => void,
    setLoading: (b: boolean) => void,
    setErr: (s: string | null) => void
  ) {
    setLoading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json()) as UploadResp;
      if (j.ok) setUrl(j.url);
      else setErr(j.error || "上传失败");
    } catch {
      setErr("网络错误,请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      action={(fd) => startTransition(() => createTalent(fd))}
      className="glass rounded-[16px] p-6 md:p-8 grid gap-4"
    >
      <Field label="艺名 / 形象名" name="stageName" placeholder="如 温雨涵 · YUHAN" required />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="性别"
          name="gender"
          options={[
            { v: "female", label: "女" },
            { v: "male", label: "男" },
            { v: "neutral", label: "中性" },
          ]}
        />
        <Field label="年龄段" name="ageBand" placeholder="如 25-30" required />
      </div>
      <Field
        label="风格标签"
        name="styleTags"
        placeholder="逗号分隔:如 都市丽人,知性,职场,口播"
        required
      />
      <Field
        label="一句话介绍"
        name="bio"
        placeholder="如:百万粉丝知识博主,适合精英人设、职场剧、口播。"
        textarea
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UploadField
          label="形象头像(图片)"
          accept="image/*"
          previewUrl={avatarUrl}
          loading={avatarLoading}
          err={avatarErr}
          onFile={(f) => handleUpload(f, "avatar", setAvatarUrl, setAvatarLoading, setAvatarErr)}
          kind="image"
        />
        <UploadField
          label="样片视频(可选)"
          accept="video/*"
          previewUrl={videoUrl}
          loading={videoLoading}
          err={videoErr}
          onFile={(f) => handleUpload(f, "video", setVideoUrl, setVideoLoading, setVideoErr)}
          kind="video"
        />
      </div>

      <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />
      <input type="hidden" name="videoUrl" value={videoUrl ?? ""} />

      <div className="grid grid-cols-3 gap-3">
        <Field label="起拍价/单部" name="priceOnce" placeholder="¥300" defaultValue="300" type="number" />
        <Field label="分账 %" name="revenueShare" placeholder="5" defaultValue="5" type="number" />
        <Field label="粉丝数" name="followers" placeholder="0" defaultValue="0" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="期望等级"
          name="grade"
          options={[
            { v: "S", label: "S · 头部" },
            { v: "A", label: "A · 主推" },
            { v: "B", label: "B · 路人" },
          ]}
          defaultValue="B"
        />
        <label className="grid gap-1.5">
          <span className="text-[12px] text-ink-3 uppercase tracking-widest">独家</span>
          <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md border border-line text-[14px] text-ink-2 cursor-pointer">
            <input type="checkbox" name="exclusive" value="1" className="accent-[#6E59F6]" />
            独家签约 Mira(锁定竞品)
          </label>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition shadow-[0_10px_30px_-12px_rgba(110,89,246,0.55)] disabled:opacity-60"
      >
        {pending && <Loader2 size={14} className="animate-spin" />}
        提交审核
      </button>
      <p className="text-[12px] text-ink-4">
        提交后形象进入「审核中」,通过后会自动上架到选角广场。
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
  defaultValue,
  textarea,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-md bg-bg/40 border border-line focus:border-brand/70 focus:bg-bg/70 outline-none transition px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-4";
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} required={required} rows={3} className={cls} />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { v: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none px-3 py-2.5 text-[14px] text-ink"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-bg text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UploadField({
  label,
  accept,
  previewUrl,
  loading,
  err,
  onFile,
  kind,
}: {
  label: string;
  accept: string;
  previewUrl: string | null;
  loading: boolean;
  err: string | null;
  onFile: (f: File) => void;
  kind: "image" | "video";
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      <div className="rounded-md border border-dashed border-line-2 hover:border-brand/70 transition px-3 py-4 grid gap-3 place-items-center text-center cursor-pointer">
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          className="hidden"
        />
        {loading ? (
          <div className="inline-flex items-center gap-2 text-[13px] text-ink-2">
            <Loader2 size={14} className="animate-spin" /> 上传中
          </div>
        ) : previewUrl ? (
          kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="h-24 w-24 object-cover rounded-md" />
          ) : (
            <video src={previewUrl} controls muted className="h-28 w-44 object-cover rounded-md" />
          )
        ) : (
          <div className="text-[12.5px] text-ink-3 inline-flex items-center gap-2">
            <UploadIcon size={14} /> 点击选择文件(最大 50MB)
          </div>
        )}
        {previewUrl && (
          <div className="text-[11px] text-ink-3 break-all max-w-full">{previewUrl}</div>
        )}
        {err && <div className="text-[12px] text-red-400">{err}</div>}
      </div>
    </label>
  );
}
