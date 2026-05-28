import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const alt = "Mira 镜界 — AIGC 时代的数字资产与 IP 创作平台";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(50% 80% at 0% 100%, rgba(110,89,246,0.55), transparent 60%), radial-gradient(40% 60% at 100% 0%, rgba(255,111,180,0.55), transparent 60%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "linear-gradient(135deg,#6E59F6,#FF6FB4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Mira 镜界</div>
        </div>
        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, opacity: 0.75 }}>AIGC 时代的数字资产与 IP 创作平台</div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.05,
              backgroundImage: "linear-gradient(135deg,#A28BFF,#FFA1CC)",
              backgroundClip: "text",
              color: "transparent",
              maxWidth: 980,
            }}
          >
            让每个人的脸成为可流通、可分账的数字资产
          </div>
          <div style={{ fontSize: 24, opacity: 0.7 }}>
            license · share · trade · on-chain
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
