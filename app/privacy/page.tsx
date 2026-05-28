import type { Metadata } from "next";
import { LegalView } from "@/components/LegalView";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "Mira 镜界 隐私政策",
};

export default function PrivacyPage() {
  return <LegalView doc={getLegalDoc("privacy")!} />;
}
