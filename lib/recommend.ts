import type { Talent } from "@/db/schema";
import { cosineByTags, tokenizeTags } from "@/lib/search";

const AGE_ORDER = [
  "16-20",
  "18-23",
  "18-25",
  "20-25",
  "22-28",
  "25-30",
  "25-32",
  "26-34",
  "28-35",
  "30-40",
];

function ageIndex(ageBand: string): number {
  const idx = AGE_ORDER.indexOf(ageBand);
  if (idx >= 0) return idx;
  // try parse "XX-YY"
  const m = /^(\d+)-(\d+)/.exec(ageBand);
  if (m) {
    const lo = Number(m[1]);
    return Math.max(0, Math.min(AGE_ORDER.length - 1, Math.floor((lo - 16) / 3)));
  }
  return -1;
}

function ageAdjacency(a: string, b: string): number {
  if (a === b) return 1;
  const ia = ageIndex(a);
  const ib = ageIndex(b);
  if (ia < 0 || ib < 0) return 0;
  const d = Math.abs(ia - ib);
  if (d === 0) return 1;
  if (d === 1) return 0.5;
  return 0;
}

export function relatedTalents(t: Talent, all: Talent[], limit = 6): Talent[] {
  const pool = all.filter((x) => x.id !== t.id && x.status === "live");
  if (pool.length === 0) return [];

  const tags = tokenizeTags(t.styleTags);
  const baseRanked = cosineByTags(tags, pool);
  const scoreMap = new Map<number, number>();
  for (const r of baseRanked) scoreMap.set(r.talent.id, r.score);

  type Scored = { talent: Talent; score: number };
  const scored: Scored[] = pool.map((p) => {
    let s = scoreMap.get(p.id) ?? 0;
    if (p.gender === t.gender) s += 0.1;
    s += 0.05 * ageAdjacency(p.ageBand, t.ageBand);
    return { talent: p, score: s };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.filter((x) => x.score > 0).slice(0, limit);
  if (top.length >= limit) return top.map((x) => x.talent);

  // Fallback: grade + followers
  const fallbackOrder = (x: Talent, y: Talent) => {
    const gradeOf = (g: string) => (g === "S" ? 3 : g === "A" ? 2 : 1);
    if (gradeOf(y.grade) !== gradeOf(x.grade)) return gradeOf(y.grade) - gradeOf(x.grade);
    return y.followers - x.followers;
  };
  const have = new Set(top.map((x) => x.talent.id));
  const rest = pool.filter((p) => !have.has(p.id)).sort(fallbackOrder);
  return [...top.map((x) => x.talent), ...rest].slice(0, limit);
}

export function similarPeers(t: Talent, all: Talent[], n = 3): Talent[] {
  const pool = all.filter((x) => x.id !== t.id && x.status === "live");
  const tags = tokenizeTags(t.styleTags);
  const ranked = cosineByTags(tags, pool);
  return ranked.filter((x) => x.score > 0).slice(0, n).map((x) => x.talent);
}
