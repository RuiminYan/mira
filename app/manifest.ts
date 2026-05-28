import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mira 镜界",
    short_name: "Mira",
    description: "AIGC 时代的数字资产与 IP 创作平台",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A0A14",
    theme_color: "#0A0A14",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
