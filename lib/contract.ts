import { sha256 } from "@/lib/chain";

export type ContractDraft = {
  kind: "kyc_license" | "order_license";
  partyAName: string;
  partyBName: string;
  scope: string;
  amount: number;
  share: number;
  bodyHTMLPayload: Record<string, unknown>;
};

export function computeContractSha(d: ContractDraft, signedAt: number): string {
  const payload = {
    kind: d.kind,
    partyA: d.partyAName,
    partyB: d.partyBName,
    scope: d.scope,
    amount: d.amount,
    share: d.share,
    signedAt,
    ...d.bodyHTMLPayload,
  };
  return sha256(JSON.stringify(payload));
}

export function contractTitle(kind: "kyc_license" | "order_license"): string {
  return kind === "kyc_license"
    ? "Mira AI 肖像授权基础合同 (KYC)"
    : "Mira AI 演员单项授权合同 (订单)";
}
