import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Camera, Sparkles } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { findSimilarFaces } from "@/lib/search";
import { FaceUploader } from "@/components/FaceUploader";

export const metadata = { title: "图搜脸" };

type Search = Promise<{ url?: string; err?: string }>;

export default async function FaceSearchPage({ searchParams }: { searchParams: Search }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/marketplace/search/face");

  const sp = await searchParams;
  const url = sp.url ?? null;

  const all = db
    .select()
    .from(schema.talents)
    .where(eq(schema.talents.status, "live"))
    .all();
  const results = url ? findSimilarFaces(url, all).slice(0, 12) : [];

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/marketplace" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回选角广场
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-ink-3">Face Search</div>
          <h1 className="text-[28px] font-semibold leading-tight md:text-[34px]">
            图搜脸 · <span className="text-gradient">找一张「神似」的合规脸</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] text-ink-3">
            上传一张参考照片,系统从合规 AI 演员库中匹配视觉风格最接近的 12 张脸。所有匹配结果都已签订平台基础授权。
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
          <Sparkles size={12} className="text-brand-2" /> 当前匹配引擎 · 模拟 v0.1
        </div>
      </div>

      {sp.err && (
        <div className="mt-4 inline-flex rounded-md bg-red-500/15 px-3 py-1.5 text-[12px] text-red-300">
          上传失败 · 请重试
        </div>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[360px_1fr]">
        <FaceUploader defaultUrl={url ?? undefined} />

        <div>
          {!url ? (
            <div className="glass flex h-full items-center justify-center rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
              <Camera size={20} className="mr-2 text-brand-2" /> 上传图片后,匹配结果会出现在这里。
            </div>
          ) : results.length === 0 ? (
            <div className="glass rounded-[14px] p-10 text-center text-[13.5px] text-ink-3">
              暂无匹配结果。
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <Link
                  key={r.talent.id}
                  href={`/marketplace/${r.talent.id}`}
                  className="glass overflow-hidden rounded-[14px] border border-line transition hover:border-line-2"
                >
                  <div
                    className="relative aspect-[4/5]"
                    style={{ background: r.talent.cover }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-white">
                      <div className="text-[13px] font-semibold">{r.talent.stageName}</div>
                      <div className="text-[11px] opacity-85">
                        {r.talent.styleTags.split(",").slice(0, 3).join(" / ")}
                      </div>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                      相似度 {(r.score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
                        style={{ width: `${Math.max(5, r.score * 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
