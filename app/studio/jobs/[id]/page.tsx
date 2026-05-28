import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Wand2 } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getJob, effectiveJobStatus } from "@/lib/studio";
import { StudioJobPoller } from "@/components/StudioJobPoller";
import { getNftByTalentId } from "@/lib/nft";
import { getLocale, t } from "@/lib/i18n";

type Params = Promise<{ id: string }>;

export const metadata = { title: "AI 作业详情" };

export default async function StudioJobDetailPage({ params }: { params: Params }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/studio");
  const p = await params;
  const id = Number(p.id);
  const job = getJob(id);
  if (!job) notFound();
  if (job.userId !== u.id && u.role !== "admin") redirect("/studio");

  const locale = await getLocale();
  const tr = (k: string, v?: Record<string, string | number>) => t(k, locale, v);
  const status = effectiveJobStatus(job);
  const talent = db.select().from(schema.talents).where(eq(schema.talents.id, job.talentId)).get();
  const nft = getNftByTalentId(job.talentId);
  const polling = status === "queued" || status === "running";

  return (
    <section className="container-page py-12 md:py-16">
      <StudioJobPoller active={polling} />
      <Link href="/studio/jobs" className="text-[13px] text-ink-3 hover:text-ink">
        ← {tr("studio.jobs.title")}
      </Link>

      <div className="mt-4 flex items-center gap-2 text-[12px] uppercase tracking-widest text-ink-3">
        <Wand2 size={12} /> {tr(`studio.kind.${job.kind}`)}
      </div>
      <h1 className="mt-2 text-[24px] md:text-[30px] font-semibold leading-tight text-ink">
        {talent?.stageName ?? "—"} · #{job.id}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label={tr("studio.detail.status")} value={tr(`studio.status.${status}`)} />
        <Stat label={tr("studio.detail.cost")} value={`${job.costCredits} c`} />
        <Stat
          label={tr("studio.detail.duration")}
          value={status === "done" ? `${(job.durationMs / 1000).toFixed(1)} s` : "—"}
        />
        <Stat label="NFT" value={nft ? `#${nft.tokenId}` : tr("market.nft.unminted")} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="glass rounded-[14px] p-5">
          <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">
            {tr("studio.detail.prompt")}
          </div>
          <p className="text-[14px] leading-6 text-ink-2 whitespace-pre-wrap">{job.prompt}</p>
          <div className="mt-4 text-[12px] text-ink-3">
            {new Date(job.createdAt * 1000).toLocaleString(locale === "en" ? "en-US" : "zh-CN", { hour12: false })}
          </div>
          {job.chainRecordId && (
            <div className="mt-3 text-[12px] text-brand">
              <Link href={`/chain/${job.chainRecordId}`} className="hover:underline">
                {tr("studio.detail.chain")} →
              </Link>
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">
            {tr("studio.detail.output")}
          </div>
          {polling ? (
            <div className="glass rounded-[14px] p-10 text-center">
              <div className="mx-auto mb-3 inline-block h-2 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
              </div>
              <div className="text-[13.5px] text-ink-3">{tr("studio.detail.poll")}</div>
            </div>
          ) : status === "failed" ? (
            <div className="glass rounded-[14px] p-6 text-[13.5px] text-amber-200">
              {tr("studio.status.failed")}
            </div>
          ) : (
            <Output kind={job.kind} cover={talent?.cover ?? null} />
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-[12px] p-4">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-2">{label}</div>
      <div className="text-[16px] text-ink truncate">{value}</div>
    </div>
  );
}

function Output({ kind, cover }: { kind: "image" | "video" | "tts"; cover: string | null }) {
  const bg = cover ?? "linear-gradient(135deg,#6E59F6,#FF6FB4)";
  if (kind === "image") {
    return (
      <div
        className="relative aspect-[3/2] overflow-hidden rounded-[14px] glow-ring"
        style={{ background: bg }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center text-white">
            <div className="text-[34px] font-semibold tracking-[0.2em]">AI-GENERATED</div>
            <div className="mt-2 text-[12px] uppercase tracking-widest opacity-80">Mira Studio · still</div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "video") {
    return (
      <div
        className="relative aspect-video overflow-hidden rounded-[14px] glow-ring"
        style={{ background: bg }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center text-white">
            <div className="text-[32px] font-semibold tracking-[0.2em]">AI-CLIP</div>
            <div className="mt-2 text-[12px] uppercase tracking-widest opacity-80">Mira Studio · 00:08</div>
          </div>
        </div>
        <div className="absolute left-4 bottom-4 right-4 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-white">▶</span>
          <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
          </div>
          <span className="text-[11px] text-white/80 font-mono">00:03 / 00:08</span>
        </div>
      </div>
    );
  }
  // tts
  return (
    <div className="glass rounded-[14px] p-6">
      <div className="text-[13px] text-ink-3 mb-4">TTS · Mira voice synthesis</div>
      <svg viewBox="0 0 200 40" className="w-full h-14" aria-hidden>
        {Array.from({ length: 40 }, (_, i) => {
          const h = 6 + Math.abs(Math.sin(i * 1.7)) * 26;
          return (
            <rect
              key={i}
              x={i * 5}
              y={(40 - h) / 2}
              width={3}
              height={h}
              rx={1.5}
              fill="url(#tts-g)"
            />
          );
        })}
        <defs>
          <linearGradient id="tts-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6E59F6" />
            <stop offset="100%" stopColor="#FF6FB4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-3 font-mono">
        <span>00:00</span>
        <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
        </div>
        <span>00:14</span>
      </div>
    </div>
  );
}
