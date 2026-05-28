type DatasetPoint = { x: string; y: number };
type LineDataset = { name: string; color: string; data: DatasetPoint[] };

function EmptyHint({ height = 200 }: { height?: number }) {
  return (
    <div
      className="grid place-items-center text-[13px] text-ink-3"
      style={{ height }}
    >
      暂无数据
    </div>
  );
}

export function LineChart({
  datasets,
  height = 220,
  yFormat = (n: number) => `¥${n.toLocaleString()}`,
}: {
  datasets: LineDataset[];
  height?: number;
  yFormat?: (n: number) => string;
}) {
  const allEmpty = datasets.every((d) => d.data.length === 0);
  if (allEmpty) return <EmptyHint height={height} />;

  const W = 800;
  const H = height;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 28;

  const xLabels = datasets[0]?.data.map((p) => p.x) ?? [];
  const n = xLabels.length;
  const xs = (i: number) =>
    PAD_L + ((W - PAD_L - PAD_R) * i) / Math.max(1, n - 1);
  const maxV = Math.max(
    1,
    ...datasets.flatMap((d) => d.data.map((p) => p.y))
  );
  const y = (v: number) =>
    H - PAD_B - ((H - PAD_T - PAD_B) * v) / maxV;

  const gridSteps = 4;
  const gridYs: number[] = [];
  for (let i = 0; i <= gridSteps; i++) {
    gridYs.push((maxV * i) / gridSteps);
  }

  return (
    <div className="glass rounded-[14px] p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }}>
        {gridYs.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
            <text
              x={PAD_L - 6}
              y={y(v) + 3}
              fontSize={9}
              textAnchor="end"
              fill="currentColor"
              opacity={0.5}
            >
              {yFormat(Math.round(v))}
            </text>
          </g>
        ))}

        {datasets.map((ds) => {
          if (ds.data.length === 0) return null;
          const d = ds.data
            .map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${y(p.y)}`)
            .join(" ");
          return (
            <g key={ds.name}>
              <path d={d} fill="none" stroke={ds.color} strokeWidth={2} />
              {ds.data.map((p, i) => (
                <circle
                  key={i}
                  cx={xs(i)}
                  cy={y(p.y)}
                  r={2.5}
                  fill={ds.color}
                >
                  <title>{`${p.x} · ${ds.name} ${yFormat(p.y)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {xLabels.map((x, i) => {
          // sparse labels: every 5th
          if (n > 14 && i % Math.ceil(n / 8) !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={xs(i)}
              y={H - PAD_B + 14}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.55}
            >
              {x.slice(5)}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-3">
        {datasets.map((ds) => (
          <span key={ds.name} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ background: ds.color }}
            />
            {ds.name}
          </span>
        ))}
      </div>
    </div>
  );
}

type BarItem = { label: string; value: number; sub?: string };

export function BarChartH({
  items,
  height = 240,
  valueFormat = (n: number) => `¥${n.toLocaleString()}`,
}: {
  items: BarItem[];
  height?: number;
  valueFormat?: (n: number) => string;
}) {
  if (items.length === 0) return <EmptyHint height={height} />;
  const max = Math.max(1, ...items.map((x) => x.value));

  return (
    <div className="glass rounded-[14px] p-4">
      <div
        className="grid gap-2"
        style={{ minHeight: Math.min(height, items.length * 32) }}
      >
        {items.map((it) => (
          <div key={it.label} className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-2">
            <div className="truncate text-[12.5px] text-ink-2">{it.label}</div>
            <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (it.value / max) * 100)}%`,
                  background:
                    "linear-gradient(90deg,#6E59F6 0%,#FF6FB4 100%)",
                }}
                title={`${it.label} · ${valueFormat(it.value)}`}
              />
            </div>
            <div className="text-right text-[12px] text-ink-3">
              {it.sub ?? valueFormat(it.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedBar({
  items,
  height = 60,
  valueFormat = (n: number) => `¥${n.toLocaleString()}`,
}: {
  items: { label: string; value: number; color: string }[];
  height?: number;
  valueFormat?: (n: number) => string;
}) {
  const total = items.reduce((a, b) => a + b.value, 0);
  if (total === 0) return <EmptyHint height={height} />;

  return (
    <div className="glass rounded-[14px] p-4">
      <div
        className="flex w-full overflow-hidden rounded-md"
        style={{ height: height * 0.5 }}
      >
        {items.map((it) => (
          <div
            key={it.label}
            style={{
              width: `${(it.value / total) * 100}%`,
              background: it.color,
            }}
            title={`${it.label} · ${valueFormat(it.value)} · ${((it.value / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 md:grid-cols-5 text-[12px]">
        {items.map((it) => (
          <span key={it.label} className="inline-flex items-center gap-1.5 text-ink-3">
            <span
              className="inline-block h-2 w-3 rounded-sm shrink-0"
              style={{ background: it.color }}
            />
            <span className="truncate text-ink-2">{it.label}</span>
            <span className="ml-auto text-ink-3">
              {((it.value / total) * 100).toFixed(0)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TwinBar({
  pairs,
  colors = ["#6E59F6", "#FF6FB4"],
  height = 200,
  valueFormat = (n: number) => `¥${n.toLocaleString()}`,
}: {
  pairs: { label: string; a: number; b: number; aName: string; bName: string }[];
  colors?: [string, string] | string[];
  height?: number;
  valueFormat?: (n: number) => string;
}) {
  if (pairs.length === 0) return <EmptyHint height={height} />;

  const W = 600;
  const H = height;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 28;

  const groupW = (W - PAD_L - PAD_R) / pairs.length;
  const barW = Math.min(28, groupW / 3);

  const max = Math.max(1, ...pairs.flatMap((p) => [p.a, p.b]));
  const y = (v: number) => H - PAD_B - ((H - PAD_T - PAD_B) * v) / max;

  return (
    <div className="glass rounded-[14px] p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={H - PAD_B}
          y2={H - PAD_B}
          stroke="currentColor"
          strokeOpacity={0.15}
        />
        {pairs.map((p, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          return (
            <g key={p.label}>
              <rect
                x={cx - barW - 2}
                y={y(p.a)}
                width={barW}
                height={H - PAD_B - y(p.a)}
                fill={colors[0]}
                rx={2}
              >
                <title>{`${p.label} · ${p.aName} ${valueFormat(p.a)}`}</title>
              </rect>
              <rect
                x={cx + 2}
                y={y(p.b)}
                width={barW}
                height={H - PAD_B - y(p.b)}
                fill={colors[1]}
                rx={2}
              >
                <title>{`${p.label} · ${p.bName} ${valueFormat(p.b)}`}</title>
              </rect>
              <text
                x={cx}
                y={H - PAD_B + 16}
                fontSize={10}
                textAnchor="middle"
                fill="currentColor"
                opacity={0.6}
              >
                {p.label}
              </text>
              <text
                x={cx - barW / 2 - 2}
                y={y(p.a) - 4}
                fontSize={9}
                textAnchor="middle"
                fill="currentColor"
                opacity={0.7}
              >
                {valueFormat(p.a)}
              </text>
              <text
                x={cx + barW / 2 + 2}
                y={y(p.b) - 4}
                fontSize={9}
                textAnchor="middle"
                fill="currentColor"
                opacity={0.7}
              >
                {valueFormat(p.b)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ background: colors[0] }} />
          {pairs[0]?.aName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ background: colors[1] }} />
          {pairs[0]?.bName}
        </span>
      </div>
    </div>
  );
}
