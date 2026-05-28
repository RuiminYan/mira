import type { Metadata } from "next";
import { LegalView } from "@/components/LegalView";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "用户服务协议",
  description: "Mira 镜界 用户服务协议",
};

export default function TermsPage() {
  return <LegalView doc={getLegalDoc("terms")!} />;
}
