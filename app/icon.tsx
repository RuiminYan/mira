import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function Icon() {
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
          fontSize: 340,
          letterSpacing: -8,
        }}
      >
        M
      </div>
    ),
    { ...size }
  );
}
