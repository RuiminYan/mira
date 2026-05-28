import type { Metadata } from "next";
import { LegalView } from "@/components/LegalView";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "数据处理协议",
  description: "Mira 镜界 数据处理协议 (DPA)",
};

export default function DpaPage() {
  return <LegalView doc={getLegalDoc("dpa")!} />;
}
