import type { Metadata } from "next";
import { LegalView } from "@/components/LegalView";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "未成年人保护",
  description: "Mira 镜界 未成年人保护规则",
};

export default function MinorsPage() {
  return <LegalView doc={getLegalDoc("minors")!} />;
}
