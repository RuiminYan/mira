"use client";

import Link from "next/link";
import { useState } from "react";
import type { HelpArticle, HelpCategory } from "@/lib/help";

type VoteSummary = { up: number; down: number };

export function HelpSearch({
  articles,
  locale,
  labels,
  voteMap,
}: {
  articles: HelpArticle[];
  locale: "zh" | "en";
  voteMap?: Record<string, VoteSummary>;
  labels: {
    searchPlaceholder: string;
    catLabels: Record<HelpCategory, string>;
    empty: string;
    all: string;
    up: string;
    down: string;
  };
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<HelpCategory | "all">("all");
  const filtered = articles.filter((a) => {
    if (cat !== "all" && a.category !== cat) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    const ql = (locale === "en" ? a.question.en : a.question.zh).toLowerCase();
    const bd = (locale === "en" ? a.body.en : a.body.zh).toLowerCase();
    return ql.includes(needle) || bd.includes(needle);
  });

  const cats: (HelpCategory | "all")[] = [
    "all",
    "start",
    "creator",
    "partner",
    "mcn",
    "legal",
    "billing",
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-md border border-line bg-bg/40 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-brand/70"
        />
        <div className="mt-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {cats.map((c) => {
            const active = cat === c;
            const cnt =
              c === "all"
                ? articles.length
                : articles.filter((a) => a.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={
                  "shrink-0 rounded-md px-3 py-2 text-left text-[13.5px] transition flex items-center justify-between gap-2 " +
                  (active
                    ? "bg-white/[0.08] text-ink"
                    : "text-ink-3 hover:text-ink hover:bg-white/[0.04]")
                }
              >
                <span>{c === "all" ? labels.all : labels.catLabels[c]}</span>
                <span className="text-[11px] text-ink-4 tabular-nums">{cnt}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <div>
        {filtered.length === 0 ? (
          <div className="glass rounded-[14px] p-10 text-center text-ink-3">{labels.empty}</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((a) => {
              const v = voteMap?.[a.slug];
              return (
                <Link
                  key={a.slug}
                  href={`/help/${a.slug}`}
                  className="glass rounded-[12px] p-5 hover:bg-white/[0.06] transition"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-ink-3">
                    <span>{labels.catLabels[a.category]}</span>
                    {v && (v.up > 0 || v.down > 0) && (
                      <span className="text-ink-4 normal-case tracking-normal">
                        · {labels.up} {v.up} / {labels.down} {v.down}
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-semibold text-ink mb-1.5">
                    {locale === "en" ? a.question.en : a.question.zh}
                  </div>
                  <p className="text-[13px] leading-6 text-ink-3 line-clamp-2">
                    {locale === "en" ? a.body.en : a.body.zh}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
