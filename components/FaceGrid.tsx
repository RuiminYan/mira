type Tile = {
  cover: string;
  name: string;
  tag: string;
};

const TILES: Tile[] = [
  { cover: "linear-gradient(135deg,#6E59F6 0%,#FF6FB4 100%)", name: "温雨涵", tag: "知性 · 都市" },
  { cover: "linear-gradient(135deg,#FF8FB1 0%,#FFC796 100%)", name: "林子伊", tag: "甜美 · 校园" },
  { cover: "linear-gradient(135deg,#5340D9 0%,#1E1B4B 100%)", name: "苏安然", tag: "御姐 · 商战" },
  { cover: "linear-gradient(135deg,#22D3EE 0%,#6E59F6 100%)", name: "Kayla", tag: "国际 · 出海" },
  { cover: "linear-gradient(135deg,#FBBF24 0%,#F87171 100%)", name: "陈梦琪", tag: "学生 · 路人" },
  { cover: "linear-gradient(135deg,#0EA5E9 0%,#6E59F6 100%)", name: "周一帆", tag: "精英 · 男主" },
  { cover: "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 100%)", name: "顾寒墨", tag: "古风 · 玄幻" },
  { cover: "linear-gradient(135deg,#FF6FB4 0%,#6E59F6 60%,#1E1B4B 100%)", name: "白若曦", tag: "古装 · 女主" },
  { cover: "linear-gradient(135deg,#22C55E 0%,#0EA5E9 100%)", name: "夏小满", tag: "邻家 · 治愈" },
];

export function FaceGrid() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto aspect-square">
      <div className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{
          background:
            "conic-gradient(from 220deg at 50% 50%, rgba(110,89,246,0.55), rgba(255,111,180,0.35), rgba(34,211,238,0.25), rgba(110,89,246,0.55))",
        }}
      />
      <div className="grid grid-cols-3 gap-3 p-3 rounded-[20px] glass glow-ring">
        {TILES.map((t, i) => (
          <div
            key={t.name}
            className="relative aspect-square rounded-[12px] overflow-hidden border border-white/10 anim-float"
            style={{ background: t.cover, animationDelay: `${(i % 5) * 0.4}s` }}
          >
            <div className="absolute inset-0 mix-blend-overlay opacity-50"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 30%, rgba(255,255,255,0.45) 0%, transparent 60%)",
              }}
            />
            <FaceSilhouette />
            <div className="absolute inset-x-0 bottom-0 p-2 text-white">
              <div className="text-[11px] font-medium leading-none">{t.name}</div>
              <div className="text-[9px] opacity-75 mt-0.5">{t.tag}</div>
            </div>
            <div className="absolute top-1.5 right-1.5 grid place-items-center h-4 px-1 rounded-full bg-black/40 text-[8px] text-white/90 backdrop-blur">
              已授权
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaceSilhouette() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <circle cx="50" cy="40" r="22" fill="#fff" />
      <path d="M14 100 C 18 70 34 60 50 60 C 66 60 82 70 86 100 Z" fill="#fff" />
    </svg>
  );
}
