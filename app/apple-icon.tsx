import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg,#6E59F6 0%,#FF6FB4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 120,
          letterSpacing: -4,
        }}
      >
        M
      </div>
    ),
    { ...size }
  );
}
