import type { Metadata } from "next";
import { LegalView } from "@/components/LegalView";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "肖像授权说明",
  description: "Mira 镜界 肖像授权说明",
};

export default function PortraitLicensePage() {
  return <LegalView doc={getLegalDoc("portrait-license")!} />;
}
